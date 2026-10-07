import Stripe from 'stripe'

let stripeClient

export function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is required to accept payments.')
  }

  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY)
  return stripeClient
}
