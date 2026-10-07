import process from 'node:process'
import express from 'express'
import { pool } from '../config/database.js'
import bookingRoutes from './routes/bookingRoutes.js'
import serviceRoutes from './routes/serviceRoutes.js'
import { handleStripeWebhook } from './controllers/stripeWebhookController.js'

const port = Number(process.env.PORT || 3001)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid port number between 1 and 65535.')
}

const app = express()

// Register the webhook before JSON parsing so Stripe's raw signature can be verified.
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook,
)

app.use(express.json({ limit: '16kb' }))

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    console.error('Database health check failed:', error)
    response.status(503).json({ status: 'error', database: 'disconnected' })
  }
})

app.use('/api', serviceRoutes)
app.use('/api', bookingRoutes)

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found.' })
})

app.use((error, _request, response, next) => {
  console.error('API request failed:', error)
  if (response.headersSent) {
    return next(error)
  }

  const isDatabaseConnectionError = [
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    '57P01',
    '57P03',
    '08000',
    '08003',
    '08006',
  ].includes(error.code)
  const status = isDatabaseConnectionError
    ? 503
    : Number.isInteger(error.status) && error.status < 500
      ? error.status
      : 500

  response.status(status).json({
    error: isDatabaseConnectionError
      ? 'The database is temporarily unavailable. Please try again shortly.'
      : status === 500
        ? 'An unexpected server error occurred.'
        : 'Invalid request.',
  })
})

const server = app.listen(port, () => {
  console.log(`API server listening on port ${port}`)
})

async function shutdown() {
  server.close((error) => {
    if (error) {
      console.error('Failed to close the API server:', error)
      process.exitCode = 1
    }

    pool.end().catch((poolError) => {
      console.error('Failed to close the PostgreSQL connection pool:', poolError)
      process.exitCode = 1
    })
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
