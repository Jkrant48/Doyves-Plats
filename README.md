# Doyves Plats

React frontend with a Node.js/Express API and PostgreSQL database. The API is
organized into routes, controllers, and database service modules under `server/`.

## Getting started

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `SUPABASE_DB_URL`, `STRIPE_SECRET_KEY`,
   `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`, a private `ADMIN_API_KEY`, and a
   private `MANAGEMENT_SESSION_SECRET`; both secrets should contain at least
   32 random bytes. The admin key is used only to create the first management
   account; the separate session secret signs its short-lived access tokens.
   Generate a fresh key with Node.js using
   `node -p "require('node:crypto').randomBytes(32).toString('hex')"` twice,
   once for each secret, and keep both values only in your local `.env` file.
3. Use the Supabase project's PostgreSQL connection string for `SUPABASE_DB_URL`. `DATABASE_URL` remains supported as a fallback for local PostgreSQL.
4. Run `npm run db:setup` to create or migrate the `users`, `category`, `services`, `appointments`, `appointment_availability_overrides`, `portfolio_images`, and `reviews` tables, and add the `Admin` and `Employee` account roles. Rerun it after schema updates so existing databases receive migrations such as the review-to-appointment link. Existing `Management` accounts are migrated to `Admin`. Setup does not add users, categories, or services. With an empty `users` table, visit `/#manage` and use the one-time setup option with `ADMIN_API_KEY` to create the first Admin account; that Admin can create Employee accounts and add categories or services later.
   If only the review-to-appointment link is missing, run `npm run db:migrate:reviews` to apply that migration without changing other tables.
5. In one terminal, run `npm run dev:server` to start the API on port 3001.
6. In another terminal, run `npm run dev` to start the Vite frontend. Requests to `/api` are proxied to the API.

For portfolio photo uploads, configure `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` in the server's
environment. Create the named Supabase Storage bucket and make it public so
portfolio images can be displayed to site visitors. Keep the service-role key
server-only; do not add it to frontend variables or source control. The API
uses `SUPABASE_DB_URL` for PostgreSQL queries (or `DATABASE_URL` if the Supabase
variable is not set), including bookings and reviews.

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
Each uploaded portfolio image stores its title, description, alternative text,
Storage path, and required service link in `public.portfolio_images`; the
displayed category is derived from that service's category. Existing portfolio
rows must be assigned a valid `services_id` before applying the schema's
required-service migration. Add the column and set each row to its correct
service in Supabase SQL Editor, then rerun `database/schema.sql`; do not assign
an arbitrary service just to satisfy the constraint.

The API exposes `GET /api/health` for database connectivity, `GET /api/categories`
for service categories, `GET /api/categories/:categoryId/services` for category
details, `GET /api/services` for bookable services, `GET /api/bookings/availability?date=YYYY-MM-DD`
for currently open time slots, and `POST /api/bookings` to create a pending
booking and Stripe Checkout session. The appointment is confirmed
after a valid signed `POST /api/stripe/webhook` event or when the payment-status
endpoint independently verifies the Checkout session with Stripe.
The form redirects customers to pay a fixed €10.00 deposit through Stripe-hosted
Checkout. Configure the Stripe webhook endpoint URL as
`https://<your-api-host>/api/stripe/webhook` and subscribe to
`checkout.session.completed`, `checkout.session.async_payment_succeeded`,
`checkout.session.async_payment_failed`, and `checkout.session.expired`.
`FRONTEND_URL` must be the browser-accessible site origin (for local development,
`http://localhost:5173`). The publishable key is not needed for this hosted
Checkout redirect; the secret key stays on the API server.
After a successful payment confirmation, the customer is shown an appointment
summary with the appointment number, service, date and time, and payment status.

Booking availability defaults to Monday–Friday, 08:00–18:00; Saturday,
09:00–17:00; and Sunday closed. Appointment start times are offered every two
hours, and a maximum of four pending-payment or active appointments may be
booked per date. Sundays are unavailable in the booking calendar and remain
closed regardless of availability overrides. Admins can add a date-specific
full-day, morning-only, afternoon-only, or closed override in the management
calendar; removing an override restores the normal weekly schedule.
Overrides are managed through the admin-only `GET`, `PUT`, and `DELETE`
`/api/management/availability` endpoints. Booking creation rechecks the schedule
and daily capacity transactionally so simultaneous requests cannot exceed the
four-appointment limit.

Clicking a category on the services section opens its database-backed services in
a dialog. The booking form loads its service options from the database and adds
each new appointment as `pending_payment` in `public.appointments` until Stripe
confirms payment through the verified webhook or the payment-status check.

Customers can submit a review using their appointment number and booking email
after payment confirms the appointment. Reviews remain unpublished until an
Admin approves them in the management view.

Set `PORT` in `.env` to change the API port; if you do, update the proxy target
in `vite.config.js` to match.
