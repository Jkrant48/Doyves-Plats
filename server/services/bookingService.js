import { pool } from '../../config/database.js'

export async function createPendingBooking({
  name,
  email,
  phone,
  serviceId,
  appointmentDate,
  appointmentTime,
  depositAmount,
}) {
  const { rows } = await pool.query(
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

  return rows[0] ?? null
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
        WHEN appointment_status = 'pending_payment' THEN $3
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
      SELECT CASE
        WHEN appointment_status IN ('confirmed', 'completed', 'missed') THEN 'paid'
        WHEN appointment_status IN ('payment_failed', 'checkout_failed') THEN 'failed'
        WHEN appointment_status = 'payment_expired' THEN 'expired'
        ELSE 'pending'
      END AS "paymentStatus"
      FROM public.appointments
      WHERE stripe_checkout_session_id = $1
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
