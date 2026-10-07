import { useEffect, useRef, useState } from "react";
import { readApiJson } from "../utils/api.js";

function getLocalDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function Booking({ selectedServiceId, onServiceChange }) {
  const [services, setServices] = useState([]);
  const [servicesError, setServicesError] = useState("");
  const [bookingMessage, setBookingMessage] = useState(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("checkout") === "cancelled") {
      return "Payment was cancelled. Your appointment has not been booked.";
    }
    if (query.get("checkout") === "success" && query.has("session_id")) {
      return "Payment received. Confirming your appointment...";
    }
    return "";
  });
  const [submitting, setSubmitting] = useState(false);
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

  function openPicker(inputRef) {
    const input = inputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  }

  useEffect(() => {
    fetch("/api/services")
      .then((response) => readApiJson(response, "Unable to load services."))
      .then((data) => data.services)
      .then(setServices)
      .catch((error) => setServicesError(error.message));
  }, []);

  // Stripe returns here after checkout; the webhook remains the source of truth.
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const checkoutResult = query.get("checkout");
    const sessionId = query.get("session_id");

    if (checkoutResult === "cancelled") {
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
      return;
    }

    if (checkoutResult !== "success" || !sessionId) return;

    window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
    let active = true;
    let timeoutId;
    let attempts = 0;

    async function checkPaymentStatus() {
      try {
        const response = await fetch(
          `/api/bookings/payment-status?sessionId=${encodeURIComponent(sessionId)}`,
        );
        const data = await readApiJson(response, "Unable to verify your payment.");
        if (!active) return;

        if (data.paymentStatus === "paid") {
          setBookingMessage("Payment confirmed. Your appointment is booked.");
          return;
        }
        if (data.paymentStatus === "failed" || data.paymentStatus === "expired") {
          setBookingMessage("Payment was not completed. Your appointment has not been booked.");
          return;
        }

        attempts += 1;
        if (attempts >= 15) {
          setBookingMessage(
            "Your payment is still being confirmed. Your appointment is not booked until confirmation completes.",
          );
          return;
        }

        timeoutId = window.setTimeout(checkPaymentStatus, 2000);
      } catch (error) {
        if (active) {
          setBookingMessage(`Unable to verify your payment: ${error.message}`);
        }
      }
    }

    checkPaymentStatus();
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setBookingMessage("");
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const booking = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      serviceId: Number(formData.get("serviceId")),
      appointmentDate: formData.get("appointmentDate"),
      appointmentTime: formData.get("appointmentTime"),
    };

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });
      const data = await readApiJson(response, "Unable to submit your booking.");

      // Redirect to Stripe-hosted Checkout; the webhook confirms the appointment.
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      setBookingMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="booking" id="booking">
      <div className="booking-container">
        <div className="booking-heading">
          <p className="booking-subtitle">BOOKING</p>
          <h2 className="section-title">Book Your</h2>
          <h2 className="section-title1">Appointment</h2>
          <p className="section-description">
            Schedule your next visit and let us tailor a look that reflects your
            personality. We&apos;ll confirm your appointment shortly.
          </p>
        </div>
        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">NAME</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter your full name"
              maxLength="120"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">EMAIL</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="your.email@example.com"
              maxLength="254"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">PHONE</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              placeholder="+1 (123) 456-7890"
              maxLength="20"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="serviceId">PREFERRED SERVICE</label>
            <select
              id="serviceId"
              name="serviceId"
              value={selectedServiceId}
              onChange={(event) => onServiceChange(event.target.value)}
              required
              disabled={services.length === 0 || Boolean(servicesError)}
            >
              <option value="" disabled>
                {servicesError ? "Services unavailable" : "Select a service"}
              </option>
              {[...new Set(services.map((service) => service.categoryName))].map(
                (categoryName) => (
                  <optgroup key={categoryName} label={categoryName}>
                    {services
                      .filter((service) => service.categoryName === categoryName)
                      .map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} — €
                          {Number(service.price).toFixed(2)}
                        </option>
                      ))}
                  </optgroup>
                ),
              )}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="appointmentDate">SELECT AN AVAILABLE DATE</label>
            <div className="booking-picker">
              <input
                ref={dateInputRef}
                type="date"
                id="appointmentDate"
                name="appointmentDate"
                min={getLocalDate()}
                required
              />
              <button
                className="booking-picker-button"
                type="button"
                aria-label="Choose appointment date"
                onClick={() => openPicker(dateInputRef)}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M16 3v4M8 3v4M3 10h18" />
                </svg>
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="appointmentTime">PREFERRED TIME</label>
            <div className="booking-picker">
              <input
                ref={timeInputRef}
                type="time"
                id="appointmentTime"
                name="appointmentTime"
                required
              />
              <button
                className="booking-picker-button"
                type="button"
                aria-label="Choose appointment time"
                onClick={() => openPicker(timeInputRef)}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
              </button>
            </div>
          </div>
          {servicesError && (
            <p className="booking-message" role="alert">
              {servicesError}
            </p>
          )}
          {!servicesError && services.length === 0 && (
            <p className="booking-message" role="status">
              Loading available services...
            </p>
          )}
          {bookingMessage && (
            <p className="booking-message" role="status">
              {bookingMessage}
            </p>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || services.length === 0}
          >
            {submitting ? "Redirecting to payment..." : "Pay €10 & Book"}
          </button>
          <p className="form-info">
            Your appointment is confirmed after the €10 payment is received.
          </p>
        </form>
      </div>
    </section>
  );
}



export default Booking;
