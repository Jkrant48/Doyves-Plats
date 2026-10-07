# Doyves Plats

React frontend with a Node.js/Express API and PostgreSQL database. The API is
organized into routes, controllers, and database service modules under `server/`.

## Getting started

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`, and `FRONTEND_URL`.
3. Create the PostgreSQL database named `doyves_plats` (or change the database name in `DATABASE_URL`).
4. Run `npm run db:setup` to create the `category`, `services`, and `appointments` tables if needed, and seed the initial categories. Add bookable services with their prices, deposits, durations, and category IDs to `public.services`.
5. In one terminal, run `npm run dev:server` to start the API on port 3001.
6. In another terminal, run `npm run dev` to start the Vite frontend. Requests to `/api` are proxied to the API.

The API expects `public.category(category_id, category_name)` and
`public.services(services_id, service_name, service_description, service_price,
deposit_amount, duration_minutes, category_id, is_active)`.
Appointments are stored in `public.appointments` using `appointments_id`,
`customer_name`, `customer_email`, `customer_phone`, `service_id`,
`appointment_datetime`, `service_price`, `deposit_amount`, and
`appointment_status`. The database setup adds `stripe_checkout_session_id` for
verified payment tracking.

The API exposes `GET /api/health` for database connectivity, `GET /api/categories`
for service categories, `GET /api/categories/:categoryId/services` for category
details, `GET /api/services` for bookable services, and `POST /api/bookings` to
create a pending booking and Stripe Checkout session. The appointment is confirmed
only after the signed `POST /api/stripe/webhook` event reports successful payment.
The form redirects customers to pay a fixed €10.00 deposit through Stripe-hosted
Checkout. Configure the Stripe webhook endpoint URL as
`https://<your-api-host>/api/stripe/webhook` and subscribe to
`checkout.session.completed`, `checkout.session.async_payment_succeeded`,
`checkout.session.async_payment_failed`, and `checkout.session.expired`.
`FRONTEND_URL` must be the browser-accessible site origin (for local development,
`http://localhost:5173`). The publishable key is not needed for this hosted
Checkout redirect; the secret key stays on the API server.

Clicking a category on the services section opens its database-backed services in
a dialog. The booking form loads its service options from the database and adds
each new appointment as `pending_payment` in `public.appointments` until Stripe's
verified webhook confirms it.

Set `PORT` in `.env` to change the API port; if you do, update the proxy target
in `vite.config.js` to match.
