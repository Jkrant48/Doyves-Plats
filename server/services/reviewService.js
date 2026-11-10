import { pool } from '../../config/database.js'

export async function findApprovedReviews() {
  const { rows } = await pool.query(`
    SELECT reviews_id AS id, review_rating AS rating, review_text AS "reviewText",
      review_author AS author, created_at AS "createdAt"
    FROM public.reviews
    WHERE is_approved = TRUE
    ORDER BY created_at DESC, reviews_id DESC
  `)
  return rows
}

export async function findPendingReviews() {
  const { rows } = await pool.query(`
    SELECT reviews_id AS id, appointment_id AS "appointmentId",
      review_rating AS rating, review_text AS "reviewText",
      review_author AS author, created_at AS "createdAt"
    FROM public.reviews
    WHERE is_approved = FALSE AND appointment_id IS NOT NULL
    ORDER BY created_at ASC, reviews_id ASC
  `)
  return rows
}

export async function createReview({
  appointmentId,
  email,
  rating,
  reviewText,
}) {
  const { rows } = await pool.query(
    `
      INSERT INTO public.reviews (
        appointment_id,
        review_rating,
        review_text,
        review_author
      )
      SELECT appointments.appointments_id, $3, $4, appointments.customer_name
      FROM public.appointments AS appointments
      WHERE appointments.appointments_id = $1
        AND LOWER(appointments.customer_email) = LOWER($2)
        AND appointments.appointment_status IN ('confirmed', 'completed', 'missed')
      RETURNING reviews_id AS id, appointment_id AS "appointmentId",
        review_rating AS rating, review_text AS "reviewText",
        review_author AS author, is_approved AS "isApproved"
    `,
    [appointmentId, email, rating, reviewText],
  )
  return rows[0] ?? null
}

export async function approveReview(reviewId) {
  const { rows } = await pool.query(
    `
      UPDATE public.reviews
      SET is_approved = TRUE
      WHERE reviews_id = $1 AND is_approved = FALSE
      RETURNING reviews_id AS id
    `,
    [reviewId],
  )
  return rows[0] ?? null
}
