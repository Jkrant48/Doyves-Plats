import { Buffer } from 'node:buffer'
import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto'
import { promisify } from 'node:util'
import { pool } from '../../config/database.js'

const scrypt = promisify(scryptCallback)
const passwordKeyLength = 64
const passwordSaltLength = 16
const managementLockId = 721403

function normalizeRole(role) {
  return role === 'Management' ? 'Admin' : role
}

export async function hashPassword(password) {
  const salt = randomBytes(passwordSaltLength).toString('base64url')
  const key = await scrypt(password, salt, passwordKeyLength)
  return `scrypt$${salt}$${Buffer.from(key).toString('base64url')}`
}

export async function verifyPassword(password, passwordHash) {
  const [algorithm, salt, storedKey, extra] = passwordHash.split('$')
  if (algorithm !== 'scrypt' || !salt || !storedKey || extra !== undefined) {
    return false
  }

  const expectedKey = Buffer.from(storedKey, 'base64url')
  if (expectedKey.length !== passwordKeyLength) {
    return false
  }

  const actualKey = Buffer.from(
    await scrypt(password, salt, passwordKeyLength),
  )
  return timingSafeEqual(expectedKey, actualKey)
}

export async function hasManagementAccount() {
  const { rows } = await pool.query(`
    SELECT EXISTS (
      SELECT 1
      FROM public.users
      WHERE user_role IN ('Admin', 'Management')
    ) AS exists
  `)
  return rows[0].exists
}

export async function createManagementAccount({ email, password }) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Serialize competing bootstrap requests so the one-time account cannot be
    // created twice by simultaneous requests.
    await client.query('SELECT pg_advisory_xact_lock($1, 1)', [managementLockId])
    const { rows: existingUsers } = await client.query(`
      SELECT users_id
      FROM public.users
      WHERE user_role IN ('Admin', 'Management')
      LIMIT 1
    `)
    if (existingUsers.length > 0) {
      const error = new Error('Management account setup has already been completed.')
      error.code = 'MANAGEMENT_ACCOUNT_EXISTS'
      throw error
    }

    const passwordHash = await hashPassword(password)
    const { rows } = await client.query(
      `
        INSERT INTO public.users (user_role, user_email, user_password_hash)
        VALUES ('Admin', $1, $2)
        RETURNING users_id AS id, user_email AS email, user_role AS role
      `,
      [email, passwordHash],
    )
    await client.query('COMMIT')
    return { ...rows[0], role: normalizeRole(rows[0].role) }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function createManagementUser({ email, password, role }) {
  const passwordHash = await hashPassword(password)
  const { rows } = await pool.query(
    `
      INSERT INTO public.users (user_role, user_email, user_password_hash)
      VALUES ($1, $2, $3)
      RETURNING users_id AS id, user_email AS email, user_role AS role
    `,
    [role, email, passwordHash],
  )
  return rows[0]
}

export async function findManagementUserByEmail(email) {
  const { rows } = await pool.query(
    `
      SELECT
        users_id AS id,
        user_email AS email,
        user_password_hash AS "passwordHash",
        user_role AS role
      FROM public.users
      WHERE user_email = $1 AND user_role IN ('Admin', 'Employee', 'Management')
    `,
    [email],
  )
  return rows[0] ? { ...rows[0], role: normalizeRole(rows[0].role) } : null
}

export async function findManagementUserById(userId) {
  const { rows } = await pool.query(
    `
      SELECT users_id AS id, user_email AS email, user_role AS role
      FROM public.users
      WHERE users_id = $1 AND user_role IN ('Admin', 'Employee', 'Management')
    `,
    [userId],
  )
  return rows[0] ? { ...rows[0], role: normalizeRole(rows[0].role) } : null
}

export function verifyManagementToken(token, secret) {
  const [payload, suppliedSignature, extra] = token.split('.')
  if (!payload || !suppliedSignature || extra !== undefined) {
    return null
  }

  const expectedSignature = Buffer.from(
    createTokenSignature(payload, secret),
    'base64url',
  )
  const actualSignature = Buffer.from(suppliedSignature, 'base64url')
  if (
    expectedSignature.length !== actualSignature.length ||
    !timingSafeEqual(expectedSignature, actualSignature)
  ) {
    return null
  }

  let claims
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  if (!claims || typeof claims !== 'object') {
    return null
  }

  const userId = Number(claims.sub)
  if (
    !Number.isSafeInteger(userId) ||
    userId < 1 ||
    userId > 2_147_483_647 ||
    !Number.isInteger(claims.exp) ||
    claims.exp <= Math.floor(Date.now() / 1000)
  ) {
    return null
  }
  return userId
}

function createTokenSignature(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}
