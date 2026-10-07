import {
  createPendingBooking,
  findPaymentStatus,
  markBookingCheckoutFailed,
  saveCheckoutSessionId,
} from '../services/bookingService.js'
import { getStripeClient } from '../services/stripeClient.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const timePattern = /^\d{2}:\d{2}$/
const paymentAmountCents = 1000

function isValidDate(value) {
  if (!datePattern.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function isValidTime(value) {
  if (!timePattern.test(value)) {
    return false
  }

  const [hours, minutes] = value.split(':').map(Number)
  return hours <= 23 && minutes <= 59
}

export async function createBooking(request, response) {
  const { name, email, phone, serviceId, appointmentDate, appointmentTime } =
    request.body ?? {}

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name.trim().length > 120 ||
    typeof email !== 'string' ||
    !emailPattern.test(email) ||
    email.length > 254 ||
    typeof phone !== 'string' ||
    !phone.trim() ||
    phone.trim().length > 20 ||
    !Number.isInteger(serviceId) ||
    serviceId < 1 ||
    typeof appointmentDate !== 'string' ||
    !isValidDate(appointmentDate) ||
    typeof appointmentTime !== 'string' ||
    !isValidTime(appointmentTime)
  ) {
    return response.status(400).json({
      error:
        'Provide a valid name, email, phone, service, appointment date, and appointment time.',
    })
  }

  const stripe = getStripeClient()
  const booking = await createPendingBooking({
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    serviceId,
    appointmentDate,
    appointmentTime,
    depositAmount: paymentAmountCents / 100,
  })

  if (!booking) {
    return response.status(400).json({ error: 'The selected service is unavailable.' })
  }

  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
  let session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email.trim(),
      client_reference_id: String(booking.id),
      metadata: { bookingId: String(booking.id) },
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: paymentAmountCents,
            product_data: { name: 'Appointment booking deposit' },
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}#booking`,
      cancel_url: `${frontendUrl}/?checkout=cancelled#booking`,
    })

    if (!session.url) {
      throw new Error('Stripe did not return a Checkout URL.')
    }

    await saveCheckoutSessionId(booking.id, session.id)
  } catch (error) {
    await markBookingCheckoutFailed(booking.id)
    throw error
  }

  return response.status(201).json({
    booking,
    checkoutUrl: session.url,
  })
}

export async function getBookingPaymentStatus(request, response) {
  const { sessionId } = request.query

  if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    return response.status(400).json({ error: 'A valid Checkout session ID is required.' })
  }

  const status = await findPaymentStatus(sessionId)
  if (!status) {
    return response.status(404).json({ error: 'Checkout session not found.' })
  }

  return response.json(status)
}
