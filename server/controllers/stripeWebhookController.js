import { updateBookingPaymentStatus } from '../services/bookingService.js'
import { getStripeClient } from '../services/stripeClient.js'

export async function handleStripeWebhook(request, response) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const signature = request.headers['stripe-signature']

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required to verify Stripe webhooks.')
  }
  if (!signature) {
    return response.status(400).send('Missing Stripe signature.')
  }

  const stripe = getStripeClient()
  let event
  try {
    // Stripe signature verification needs the exact, unparsed request bytes.
    event = stripe.webhooks.constructEvent(
      request.body,
      signature,
      webhookSecret,
    )
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error.message)
    return response.status(400).send('Invalid Stripe webhook signature.')
  }

  const checkoutEvents = [
    'checkout.session.completed',
    'checkout.session.async_payment_succeeded',
    'checkout.session.async_payment_failed',
    'checkout.session.expired',
  ]

  if (!checkoutEvents.includes(event.type)) {
    return response.json({ received: true })
  }

  const session = event.data.object
  const bookingId = Number(session.metadata?.bookingId)
  if (!Number.isInteger(bookingId) || bookingId < 1 || !session.id) {
    return response.status(400).send('Checkout session is missing booking metadata.')
  }

  let nextStatus = null
  if (
    (event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded') &&
    session.payment_status === 'paid'
  ) {
    if (session.amount_total !== 1000 || session.currency !== 'eur') {
      console.error(
        `Stripe reported an unexpected amount or currency for booking ${bookingId}.`,
      )
      return response.status(400).send('Payment amount or currency does not match the booking deposit.')
    }
    nextStatus = 'confirmed'
  } else if (event.type === 'checkout.session.async_payment_failed') {
    nextStatus = 'payment_failed'
  } else if (event.type === 'checkout.session.expired') {
    nextStatus = 'payment_expired'
  }

  if (nextStatus) {
    // Only a valid paid event can move a pending appointment to confirmed.
    const booking = await updateBookingPaymentStatus(
      bookingId,
      session.id,
      nextStatus,
    )

    if (!booking) {
      throw new Error(`No booking matches Stripe Checkout session ${session.id}.`)
    }
  }

  return response.json({ received: true })
}
