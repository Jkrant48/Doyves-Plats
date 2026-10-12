import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { pool } from '../config/database.js'

const schemaPath = new URL('../database/schema.sql', import.meta.url)

try {
  const schema = await readFile(fileURLToPath(schemaPath), 'utf8')
  // Commit new enum values before the schema transaction uses them to migrate
  // existing Management accounts or insert new Admin and Employee accounts.
  await pool.query(
    "ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'Management'",
  )
  await pool.query(
    "ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'Admin'",
  )
  await pool.query(
    "ALTER TYPE public.account_type ADD VALUE IF NOT EXISTS 'Employee'",
  )
  await pool.query(schema)
  console.log('Database schema created; no categories or services were added.')
} catch (error) {
  console.error('Failed to set up the database:', error)
  process.exitCode = 1
} finally {
  await pool.end()
}
