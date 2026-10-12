import { Buffer } from 'node:buffer'
import process from 'node:process'
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import {
  createManagementAccount,
  createManagementUser,
  findManagementUserByEmail,
  hasManagementAccount,
  verifyPassword,
} from '../services/managementAuthService.js'

const minimumSecretBytes = 32

function configuredSecret(secret) {
  return secret && Buffer.byteLength(secret) >= minimumSecretBytes
    ? secret
    : null
}

function validEmail(value) {
  return (
    typeof value === 'string' &&
    value.length <= 255 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  )
}

function validPassword(value) {
  return (
    typeof value === 'string' &&
    value.length >= 12 &&
    value.length <= 128
  )
}

function matchesBootstrapKey(suppliedKey, configuredKey) {
  const expectedHash = createHash('sha256').update(configuredKey).digest()
  const suppliedHash = createHash('sha256')
    .update(typeof suppliedKey === 'string' ? suppliedKey : '')
    .digest()
  return timingSafeEqual(expectedHash, suppliedHash)
}

function createAccessToken(userId, secret) {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    }),
  ).toString('base64url')
  const signature = createHmac('sha256', secret)
    .update(payload)
    .digest('base64url')
  return `${payload}.${signature}`
}

function sendAuthenticatedUser(response, user, secret) {
  response.set('Cache-Control', 'no-store')
  return response.json({
    token: createAccessToken(user.id, secret),
    user: { id: user.id, email: user.email, role: user.role },
  })
}

export async function getBootstrapStatus(_request, response) {
  const setupKey = configuredSecret(process.env.ADMIN_API_KEY)
  const sessionSecret = configuredSecret(process.env.MANAGEMENT_SESSION_SECRET)
  const registrationAvailable =
    setupKey !== null &&
    sessionSecret !== null &&
    !(await hasManagementAccount())
  response.set('Cache-Control', 'no-store')
  return response.json({ registrationAvailable })
}

export async function registerManagementAccount(request, response) {
  const setupKey = configuredSecret(process.env.ADMIN_API_KEY)
  const sessionSecret = configuredSecret(process.env.MANAGEMENT_SESSION_SECRET)
  if (!setupKey || !sessionSecret) {
    return response.status(503).json({
      error: 'Management account setup is not configured on the server.',
    })
  }

  if (!matchesBootstrapKey(request.body?.bootstrapKey, setupKey)) {
    return response.status(401).json({ error: 'Invalid setup key.' })
  }

  const email =
    typeof request.body?.email === 'string'
      ? request.body.email.trim().toLowerCase()
      : ''
  const { password } = request.body ?? {}
  if (!validEmail(email) || !validPassword(password)) {
    return response.status(400).json({
      error: 'Enter a valid email and a password of at least 12 characters.',
    })
  }

  try {
    const user = await createManagementAccount({ email, password })
    return sendAuthenticatedUser(response, user, sessionSecret)
  } catch (error) {
    if (error.code === 'MANAGEMENT_ACCOUNT_EXISTS') {
      return response.status(409).json({
        error: 'Management account setup has already been completed.',
      })
    }
    if (error.code === '23505') {
      return response.status(409).json({
        error: 'An account with this email already exists.',
      })
    }
    throw error
  }
}

export async function loginManagementAccount(request, response) {
  const sessionSecret = configuredSecret(process.env.MANAGEMENT_SESSION_SECRET)
  if (!sessionSecret) {
    return response.status(503).json({
      error: 'Management access is not configured on the server.',
    })
  }

  const email =
    typeof request.body?.email === 'string'
      ? request.body.email.trim().toLowerCase()
      : ''
  const { password } = request.body ?? {}
  if (
    !validEmail(email) ||
    typeof password !== 'string' ||
    password.length > 128
  ) {
    return response.status(400).json({ error: 'Enter a valid email and password.' })
  }

  const user = await findManagementUserByEmail(email)
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return response.status(401).json({ error: 'Invalid email or password.' })
  }

  return sendAuthenticatedUser(response, user, sessionSecret)
}

export async function createManagementUserAccount(request, response) {
  const email =
    typeof request.body?.email === 'string'
      ? request.body.email.trim().toLowerCase()
      : ''
  const { password, role } = request.body ?? {}
  if (
    !validEmail(email) ||
    !validPassword(password) ||
    !['Admin', 'Employee'].includes(role)
  ) {
    return response.status(400).json({
      error: 'Enter a valid email, a password of at least 12 characters, and a valid role.',
    })
  }

  try {
    const user = await createManagementUser({ email, password, role })
    response.set('Cache-Control', 'no-store')
    return response.status(201).json({
      user: { id: user.id, email: user.email, role: user.role },
    })
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({
        error: 'An account with this email already exists.',
      })
    }
    throw error
  }
}
