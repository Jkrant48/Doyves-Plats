# Doyves Plats

React frontend with a Node.js/Express API and PostgreSQL database. The API is
organized into routes, controllers, and database service modules under `server/`.

## Getting started

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`, `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`, a private `ADMIN_API_KEY`, and a
   private `MANAGEMENT_SESSION_SECRET`; both secrets should contain at least
   32 random bytes. The admin key is used only to create the first management
   account; the separate session secret signs its short-lived access tokens.
   Generate a fresh key with Node.js using
   `node -p "require('node:crypto').randomBytes(32).toString('hex')"` twice,
   once for each secret, and keep both values only in your local `.env` file.
3. Create the PostgreSQL database named `doyves_plats` (or change the database name in `DATABASE_URL`).
4. Run `npm run db:setup` to create the `users`, `category`, `services`, `appointments`, and `portfolio_images` tables if needed, and add the `Admin` and `Employee` account roles. Existing `Management` accounts are migrated to `Admin`. Setup does not add users, categories, or services. With an empty `users` table, visit `/#manage` and use the one-time setup option with `ADMIN_API_KEY` to create the first Admin account; that Admin can create Employee accounts and add categories or services later.
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
The management view is available at `/#manage`. On first setup, choose
**Create the management account** and provide an email, a password of at least
12 characters, and the server's `ADMIN_API_KEY`. This creates the first Admin;
setup is accepted only while no Admin account exists, and competing setup
requests are serialized so bootstrap succeeds only once. After logging in, an
Admin can use **Create account** to add Admin or Employee accounts. Employees
can view appointments only; account creation, appointment updates, and all
service, category, and portfolio management are Admin-only. Management access
requires the account's email and password. Successful login returns a 12-hour
signed token held only in browser memory; signing out or reloading the page
requires signing in again. After the first Admin is created, `ADMIN_API_KEY`
can be removed from the server; keep `MANAGEMENT_SESSION_SECRET` configured
there and never expose either secret in frontend configuration. Use HTTPS
outside local development. Management endpoints require the signed bearer token: `GET /api/management/appointments`,
`PATCH /api/management/appointments/:appointmentId`, `GET
/api/management/services`, category `POST /api/categories`, `PATCH
/api/categories/:categoryId`, and `DELETE /api/categories/:categoryId`, and
service `POST /api/services`, `PATCH /api/services/:serviceId`, and
`DELETE /api/services/:serviceId` operations. `POST
/api/services/:serviceId/restore` reactivates a service. Portfolio management
uses `POST /api/management/portfolio` and `PATCH` or `DELETE
/api/management/portfolio/:imageId`. Deleting a service archives it from booking
while preserving its appointment history. Categories with services cannot be
deleted. Appointments can be marked completed or missed after payment
confirmation. `GET /api/portfolio` supplies database image URLs to the public
portfolio section, which continues to show the client-side sample gallery.

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
