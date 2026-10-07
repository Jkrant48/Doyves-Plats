import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { pool } from '../config/database.js'

const schemaPath = new URL('../database/schema.sql', import.meta.url)

try {
  const schema = await readFile(fileURLToPath(schemaPath), 'utf8')
  await pool.query(schema)
  console.log('Database schema created and default services seeded.')
} catch (error) {
  console.error('Failed to set up the database:', error)
  process.exitCode = 1
} finally {
  await pool.end()
}
