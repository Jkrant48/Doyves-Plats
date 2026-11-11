import process from 'node:process'
import {
  createPendingBooking,
  deleteAvailabilityOverride,
  findAvailabilityOverrides,
  findDailyAvailability,
  findAllAppointments,
  findPaymentStatus,
  markBookingCheckoutFailed,
  saveCheckoutSessionId,
  saveAvailabilityOverride,
  setAppointmentOutcome,
  updateBookingPaymentStatus,
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
  let booking
  try {
    booking = await createPendingBooking({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      serviceId,
      appointmentDate,
      appointmentTime,
      depositAmount: paymentAmountCents / 100,
    })
  } catch (error) {
    if (error.code === 'BOOKING_UNAVAILABLE') {
      return response.status(409).json({ error: error.message })
    }
    throw error
  }

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

export async function getBookingAvailability(request, response) {
  const { date } = request.query
  if (typeof date !== 'string' || !isValidDate(date)) {
    return response.status(400).json({ error: 'Provide a valid appointment date.' })
  }
  return response.json(await findDailyAvailability(date))
}

export async function getManagedAvailability(_request, response) {
  return response.json({ overrides: await findAvailabilityOverrides() })
}

export async function updateManagedAvailability(request, response) {
  const { date, mode } = request.body ?? {}
  if (
    typeof date !== 'string' ||
    !isValidDate(date) ||
    new Date(`${date}T00:00:00.000Z`).getUTCDay() === 0 ||
    !['full', 'morning', 'afternoon', 'closed'].includes(mode)
  ) {
    return response.status(400).json({
      error: 'Choose a non-Sunday date and availability of full, morning, afternoon, or closed.',
    })
  }
  const override = await saveAvailabilityOverride(date, mode)
  return response.json({ override })
}

export async function deleteManagedAvailability(request, response) {
  const { date } = request.params
  if (!isValidDate(date)) {
    return response.status(400).json({ error: 'Provide a valid appointment date.' })
  }
  const deleted = await deleteAvailabilityOverride(date)
  if (!deleted) {
    return response.status(404).json({ error: 'No availability override exists for this date.' })
  }
  return response.json({ deleted: true })
}

export async function getBookingPaymentStatus(request, response) {
  const { sessionId } = request.query

  if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_')) {
    return response.status(400).json({ error: 'A valid Checkout session ID is required.' })
  }

  let status = await findPaymentStatus(sessionId)
  if (!status) {
    return response.status(404).json({ error: 'Checkout session not found.' })
  }

  if (status.paymentStatus !== 'paid') {
    const stripeSession = await getStripeClient().checkout.sessions.retrieve(sessionId)
    const sessionBookingId = Number(stripeSession.metadata?.bookingId)
    if (
      stripeSession.id !== sessionId ||
      sessionBookingId !== status.appointmentId
    ) {
      return response.status(404).json({ error: 'Checkout session not found.' })
    }

    let nextStatus = null
    if (stripeSession.payment_status === 'paid') {
      if (stripeSession.amount_total !== paymentAmountCents || stripeSession.currency !== 'eur') {
        console.error(
          `Stripe reported an unexpected amount or currency for booking ${status.appointmentId}.`,
        )
        return response.status(409).json({
          error: 'The payment does not match the booking deposit.',
        })
      }
      nextStatus = 'confirmed'
    } else if (stripeSession.status === 'expired') {
      nextStatus = 'payment_expired'
    }

    if (nextStatus) {
      const updatedBooking = await updateBookingPaymentStatus(
        status.appointmentId,
        sessionId,
        nextStatus,
      )
      if (!updatedBooking) {
        throw new Error(
          `No booking matches Stripe Checkout session ${sessionId}.`,
        )
      }
      status = await findPaymentStatus(sessionId)
    }
  }

  return response.json(status)
}

export async function getManagedAppointments(_request, response) {
  const appointments = await findAllAppointments()
  return response.json({ appointments })
}

export async function updateAppointmentOutcome(request, response) {
  const appointmentId = Number(request.params.appointmentId)
  const { status } = request.body ?? {}

  if (
    !Number.isInteger(appointmentId) ||
    appointmentId < 1 ||
    !['completed', 'missed'].includes(status)
  ) {
    return response.status(400).json({
      error: 'Provide a valid appointment ID and a status of completed or missed.',
    })
  }

  const appointment = await setAppointmentOutcome(appointmentId, status)
  if (!appointment) {
    return response.status(409).json({
      error: 'Only confirmed, completed, or missed appointments can be updated.',
    })
  }

  return response.json({ appointment })
}
