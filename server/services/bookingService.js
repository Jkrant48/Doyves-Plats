import { pool } from '../../config/database.js'
import { getDailySchedule } from './bookingAvailability.js'

export async function createPendingBooking({
  name,
  email,
  phone,
  serviceId,
  appointmentDate,
  appointmentTime,
  depositAmount,
}) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [appointmentDate])

    const { rows: clockRows } = await client.query(
      `SELECT CURRENT_DATE::text AS date,
         to_char(LOCALTIME, 'HH24:MI') AS time`,
    )
    if (
      appointmentDate < clockRows[0].date ||
      (appointmentDate === clockRows[0].date && appointmentTime <= clockRows[0].time)
    ) {
      const error = new Error('The selected date or time is in the past.')
      error.code = 'BOOKING_UNAVAILABLE'
      throw error
    }

    const { rows: overrideRows } = await client.query(
      `SELECT availability_type AS mode
       FROM public.appointment_availability_overrides
       WHERE availability_date = $1::date`,
      [appointmentDate],
    )
    const schedule = getDailySchedule(appointmentDate, overrideRows[0]?.mode ?? null)
    if (!schedule.slots.includes(appointmentTime)) {
      const error = new Error('The selected date or time is unavailable.')
      error.code = 'BOOKING_UNAVAILABLE'
      throw error
    }

    const { rows: capacityRows } = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM public.appointments
       WHERE appointment_datetime::date = $1::date
         AND appointment_status IN ('pending_payment', 'confirmed', 'completed', 'missed')`,
      [appointmentDate],
    )
    if (capacityRows[0].count >= 4) {
      const error = new Error('There are no appointments left on this date.')
      error.code = 'BOOKING_UNAVAILABLE'
      throw error
    }

    const { rows: occupiedRows } = await client.query(
      `SELECT 1
       FROM public.appointments
       WHERE appointment_datetime = $1::date + $2::time
         AND appointment_status IN ('pending_payment', 'confirmed', 'completed', 'missed')
       LIMIT 1`,
      [appointmentDate, appointmentTime],
    )
    if (occupiedRows.length > 0) {
      const error = new Error('The selected time is no longer available.')
      error.code = 'BOOKING_UNAVAILABLE'
      throw error
    }

    const { rows } = await client.query(
      `
        INSERT INTO public.appointments (
          customer_name,
          customer_email,
          customer_phone,
          service_id,
          appointment_datetime,
          service_price,
          deposit_amount,
          appointment_status
        )
        SELECT $1, $2, $3, services.services_id,
          $5::date + $6::time, services.service_price, $7, 'pending_payment'
        FROM public.services AS services
        WHERE services.services_id = $4 AND services.is_active = TRUE
        RETURNING appointments_id AS id, service_id AS "serviceId",
          appointment_datetime AS "appointmentDateTime",
          appointment_status AS "bookingStatus",
          created_at AS "createdAt"
      `,
      [name, email, phone, serviceId, appointmentDate, appointmentTime, depositAmount],
    )
    await client.query('COMMIT')
    return rows[0] ?? null
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function findDailyAvailability(date) {
  const [
    { rows: overrideRows },
    { rows: capacityRows },
    { rows: occupiedRows },
    { rows: clockRows },
  ] = await Promise.all([
      pool.query(
        `SELECT availability_type AS mode
         FROM public.appointment_availability_overrides
         WHERE availability_date = $1::date`,
        [date],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM public.appointments
         WHERE appointment_datetime::date = $1::date
           AND appointment_status IN ('pending_payment', 'confirmed', 'completed', 'missed')`,
        [date],
      ),
      pool.query(
        `SELECT to_char(appointment_datetime, 'HH24:MI') AS time
         FROM public.appointments
         WHERE appointment_datetime::date = $1::date
           AND appointment_status IN ('pending_payment', 'confirmed', 'completed', 'missed')`,
        [date],
      ),
      pool.query(
        `SELECT CURRENT_DATE::text AS date,
           to_char(LOCALTIME, 'HH24:MI') AS time`,
      ),
    ])
  const schedule = getDailySchedule(date, overrideRows[0]?.mode ?? null)
  const remainingAppointments = Math.max(0, 4 - capacityRows[0].count)
  const occupiedTimes = new Set(occupiedRows.map((row) => row.time))
  const currentDate = clockRows[0].date
  const currentTime = clockRows[0].time

  return {
    date,
    mode: schedule.mode,
    openingTime: schedule.openingTime,
    closingTime: schedule.closingTime,
    remainingAppointments,
    slots: remainingAppointments > 0 && date >= currentDate
      ? schedule.slots.filter((time) =>
        !occupiedTimes.has(time) && (date !== currentDate || time > currentTime),
      )
      : [],
  }
}

export async function findAvailabilityOverrides() {
  const { rows } = await pool.query(
    `SELECT availability_date AS date, availability_type AS mode
     FROM public.appointment_availability_overrides
     WHERE availability_date >= CURRENT_DATE
     ORDER BY availability_date`,
  )
  return rows
}

export async function saveAvailabilityOverride(date, mode) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [date])
    const { rows } = await client.query(
      `INSERT INTO public.appointment_availability_overrides (
         availability_date, availability_type
       )
       VALUES ($1::date, $2)
       ON CONFLICT (availability_date)
       DO UPDATE SET availability_type = EXCLUDED.availability_type
       RETURNING availability_date AS date, availability_type AS mode`,
      [date, mode],
    )
    await client.query('COMMIT')
    return rows[0]
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function deleteAvailabilityOverride(date) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [date])
    const result = await client.query(
      `DELETE FROM public.appointment_availability_overrides
       WHERE availability_date = $1::date`,
      [date],
    )
    await client.query('COMMIT')
    return result.rowCount > 0
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function saveCheckoutSessionId(bookingId, sessionId) {
  const result = await pool.query(
    `UPDATE public.appointments
     SET stripe_checkout_session_id = $2
     WHERE appointments_id = $1 AND appointment_status = 'pending_payment'`,
    [bookingId, sessionId],
  )
  if (result.rowCount !== 1) {
    throw new Error(`Unable to associate Stripe Checkout session with booking ${bookingId}.`)
  }
}

export async function markBookingCheckoutFailed(bookingId) {
  await pool.query(
    `UPDATE public.appointments
     SET appointment_status = 'checkout_failed'
     WHERE appointments_id = $1 AND appointment_status = 'pending_payment'`,
    [bookingId],
  )
}

export async function updateBookingPaymentStatus(bookingId, sessionId, nextStatus) {
  const { rows } = await pool.query(
    `
      UPDATE public.appointments
      SET appointment_status = CASE
        WHEN appointment_status = 'pending_payment'
          OR (
            $3 = 'confirmed'
            AND appointment_status IN ('payment_failed', 'payment_expired')
          )
        THEN $3
        ELSE appointment_status
      END
      WHERE appointments_id = $1 AND stripe_checkout_session_id = $2
      RETURNING appointment_status AS "bookingStatus"
    `,
    [bookingId, sessionId, nextStatus],
  )

  return rows[0] ?? null
}

export async function findPaymentStatus(sessionId) {
  const { rows } = await pool.query(
    `
      SELECT appointments.appointments_id AS "appointmentId",
        appointments.appointment_datetime AS "appointmentDateTime",
        appointments.service_price AS "servicePrice",
        appointments.deposit_amount AS "depositAmount",
        appointments.appointment_status AS "appointmentStatus",
        services.service_name AS "serviceName",
        category.category_name AS "categoryName",
        CASE
        WHEN appointments.appointment_status IN ('confirmed', 'completed', 'missed') THEN 'paid'
        WHEN appointments.appointment_status IN ('payment_failed', 'checkout_failed') THEN 'failed'
        WHEN appointments.appointment_status = 'payment_expired' THEN 'expired'
        ELSE 'pending'
        END AS "paymentStatus"
      FROM public.appointments AS appointments
      LEFT JOIN public.services AS services
        ON services.services_id = appointments.service_id
      LEFT JOIN public.category AS category
        ON category.category_id = services.category_id
      WHERE appointments.stripe_checkout_session_id = $1
    `,
    [sessionId],
  )

  return rows[0] ?? null
}

export async function findAllAppointments() {
  const { rows } = await pool.query(`
    SELECT
      appointments.appointments_id AS id,
      appointments.customer_name AS "customerName",
      appointments.customer_email AS "customerEmail",
      appointments.customer_phone AS "customerPhone",
      appointments.appointment_datetime AS "appointmentDateTime",
      appointments.service_price AS "servicePrice",
      appointments.deposit_amount AS "depositAmount",
      appointments.appointment_status AS status,
      CASE
        WHEN appointments.appointment_status IN ('confirmed', 'completed', 'missed') THEN 'paid'
        WHEN appointments.appointment_status IN ('payment_failed', 'checkout_failed') THEN 'failed'
        WHEN appointments.appointment_status = 'payment_expired' THEN 'expired'
        ELSE 'pending'
      END AS "paymentStatus",
      services.service_name AS "serviceName",
      category.category_name AS "categoryName"
    FROM public.appointments AS appointments
    LEFT JOIN public.services AS services
      ON services.services_id = appointments.service_id
    LEFT JOIN public.category AS category
      ON category.category_id = services.category_id
    ORDER BY appointments.appointment_datetime DESC, appointments.appointments_id DESC
  `)

  return rows
}

export async function setAppointmentOutcome(appointmentId, status) {
  const { rows } = await pool.query(
    `
      UPDATE public.appointments
      SET appointment_status = $2
      WHERE appointments_id = $1
        AND appointment_status IN ('confirmed', 'completed', 'missed')
      RETURNING appointments_id AS id, appointment_status AS status
    `,
    [appointmentId, status],
  )

  return rows[0] ?? null
}
