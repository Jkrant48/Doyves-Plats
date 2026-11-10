import {
  approveReview as approveReviewRecord,
  createReview as insertReview,
  findApprovedReviews,
  findPendingReviews,
} from '../services/reviewService.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function getApprovedReviews(_request, response) {
  const reviews = await findApprovedReviews()
  return response.json({ reviews })
}

export async function createReview(request, response) {
  const { appointmentId, email, rating, reviewText } = request.body ?? {}
  const normalizedEmail = typeof email === 'string' ? email.trim() : ''
  const normalizedText = typeof reviewText === 'string' ? reviewText.trim() : ''

  if (
    !Number.isInteger(appointmentId) ||
    appointmentId < 1 ||
    !emailPattern.test(normalizedEmail) ||
    normalizedEmail.length > 254 ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    !normalizedText ||
    normalizedText.length > 2000
  ) {
    return response.status(400).json({
      error: 'Provide a valid appointment number, email, 1–5 star rating, and review of up to 2,000 characters.',
    })
  }

  try {
    const review = await insertReview({
      appointmentId,
      email: normalizedEmail,
      rating,
      reviewText: normalizedText,
    })
    if (!review) {
      return response.status(403).json({
        error: 'A paid, confirmed appointment matching that number and email is required to leave a review.',
      })
    }

    return response.status(201).json({
      review,
      message: 'Your review was submitted and is waiting for approval.',
    })
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({
        error: 'A review has already been submitted for this appointment.',
      })
    }
    throw error
  }
}

export async function getPendingReviews(_request, response) {
  const reviews = await findPendingReviews()
  return response.json({ reviews })
}

export async function approveReview(request, response) {
  const reviewId = Number(request.params.reviewId)
  if (!Number.isInteger(reviewId) || reviewId < 1) {
    return response.status(400).json({ error: 'Review ID must be a positive integer.' })
  }

  const review = await approveReviewRecord(reviewId)
  if (!review) {
    return response.status(404).json({ error: 'Pending review not found.' })
  }
  return response.json({ review })
}
