import process from 'node:process'
import { pool } from '../config/database.js'

const client = await pool.connect()

try {
  await client.query('BEGIN')
  await client.query(`
    ALTER TABLE public.reviews
      ADD COLUMN IF NOT EXISTS appointment_id INT
  `)

  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'reviews_appointment_fk'
          AND conrelid = 'public.reviews'::regclass
      ) THEN
        ALTER TABLE public.reviews
          ADD CONSTRAINT reviews_appointment_fk
          FOREIGN KEY (appointment_id)
          REFERENCES public.appointments(appointments_id)
          ON UPDATE CASCADE
          ON DELETE CASCADE;
      END IF;
    END
    $$
  `)

  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS reviews_appointment_id_unique
      ON public.reviews (appointment_id)
      WHERE appointment_id IS NOT NULL
  `)
  await client.query('COMMIT')
  console.log('Review appointment-link migration completed.')
} catch (error) {
  await client.query('ROLLBACK')
  console.error('Failed to migrate review appointment links:', error)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
