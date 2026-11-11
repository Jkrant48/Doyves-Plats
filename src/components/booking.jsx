import { useEffect, useRef, useState } from "react";
import { readApiJson } from "../utils/api.js";
import DateCalendar from "./DateCalendar.jsx";

function getLocalDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function Booking({ selectedServiceId, onServiceChange }) {
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [bookingMessage, setBookingMessage] = useState(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("checkout") === "success" && query.has("session_id")) {
      return "Payment received. Confirming your appointment...";
    }
    return "";
  });
  const [submitting, setSubmitting] = useState(false);
  const [appointmentConfirmation, setAppointmentConfirmation] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [dateAvailability, setDateAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [availabilityRefresh, setAvailabilityRefresh] = useState(0);
  const confirmationDialogRef = useRef(null);
  const checkoutReturnRef = useRef(null);
  if (checkoutReturnRef.current === null) {
    const query = new URLSearchParams(window.location.search);
    checkoutReturnRef.current = {
      result: query.get("checkout"),
      sessionId: query.get("session_id"),
    };
  }

  useEffect(() => {
    const dialog = confirmationDialogRef.current;
    if (appointmentConfirmation && dialog && !dialog.open) dialog.showModal();
  }, [appointmentConfirmation]);

  useEffect(() => {
    fetch("/api/services")
      .then((response) => readApiJson(response, "Unable to load services."))
      .then((data) => data.services)
      .then(setServices)
      .catch((error) => console.error("Unable to load services.", error))
      .finally(() => setLoadingServices(false));
  }, []);

  useEffect(() => {
    if (!appointmentDate) {
      return undefined;
    }

    let active = true;
    fetch(`/api/bookings/availability?date=${encodeURIComponent(appointmentDate)}`)
      .then((response) =>
        readApiJson(response, "Unable to load appointment availability."),
      )
      .then((data) => {
        if (active) setDateAvailability(data);
      })
      .catch((error) => {
        if (active) {
          setDateAvailability(null);
          setAvailabilityError("Unable to load availability. Please try again.");
          console.error("Unable to load appointment availability.", error);
        }
      })
      .finally(() => {
        if (active) setAvailabilityLoading(false);
      });

    return () => {
      active = false;
    };
  }, [appointmentDate, availabilityRefresh]);

  // Stripe returns here after checkout; the webhook remains the source of truth.
  useEffect(() => {
    const { result: checkoutResult, sessionId } = checkoutReturnRef.current;

    if (checkoutResult === "cancelled") {
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash}`);
      console.warn("Stripe Checkout was cancelled.");
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
          setBookingMessage("");
          setAppointmentConfirmation(data);
          return;
        }
        if (data.paymentStatus === "failed" || data.paymentStatus === "expired") {
          console.error("The booking payment was not completed.", data.paymentStatus);
          setBookingMessage("");
          return;
        }

        attempts += 1;
        if (attempts >= 15) {
          console.warn("Booking payment confirmation is still pending.");
          setBookingMessage("");
          return;
        }

        timeoutId = window.setTimeout(checkPaymentStatus, 2000);
      } catch (error) {
        if (active) {
          console.error("Unable to verify your payment.", error);
          setBookingMessage("");
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
    if (!appointmentDate) {
      setBookingMessage("Please select an appointment date.");
      return;
    }
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const booking = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      serviceId: Number(formData.get("serviceId")),
      appointmentDate,
      appointmentTime,
    };

    let availabilityConflict = false;
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(booking),
      });
      availabilityConflict = response.status === 409;
      const data = await readApiJson(response, "Unable to submit your booking.");

      // Redirect to Stripe-hosted Checkout; the webhook confirms the appointment.
      window.location.assign(data.checkoutUrl);
    } catch (error) {
      console.error("Unable to submit your booking.", error);
      setBookingMessage(error.message || "Unable to submit your booking.");
      if (availabilityConflict) {
        setAvailabilityLoading(true);
        setAvailabilityRefresh((current) => current + 1);
        setAppointmentTime("");
      }
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
            personality. Choose from available two-hour time slots; up to four
            appointments can be booked each day.
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
              disabled={services.length === 0}
            >
              <option value="" disabled>
                Select a service
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
            <label>SELECT AN AVAILABLE DATE</label>
            <DateCalendar
              selectedDate={appointmentDate}
              minDate={getLocalDate()}
              label="Select an appointment date"
              onSelect={(date) => {
                setAppointmentDate(date);
                setAppointmentTime("");
                setDateAvailability(null);
                setAvailabilityLoading(Boolean(date));
                setAvailabilityError("");
                setBookingMessage("");
              }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="appointmentTime">PREFERRED TIME</label>
            <select
              id="appointmentTime"
              name="appointmentTime"
              value={appointmentTime}
              onChange={(event) => {
                setAppointmentTime(event.target.value);
                setBookingMessage("");
              }}
              required
              disabled={!dateAvailability?.slots.length || availabilityLoading}
            >
              <option value="" disabled>
                {availabilityLoading
                  ? "Loading available times..."
                  : "Select an available time"}
              </option>
              {(dateAvailability?.slots ?? []).map((time) => (
                <option key={time} value={time}>
                  {new Date(`2000-01-01T${time}:00`).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </option>
              ))}
            </select>
          </div>
          {availabilityError && (
            <p className="booking-message" role="alert">
              {availabilityError}
            </p>
          )}
          {appointmentDate && !availabilityLoading && !availabilityError && (
            <p className="booking-message" role="status">
              {dateAvailability?.slots.length
                ? `${dateAvailability.remainingAppointments} appointment${dateAvailability.remainingAppointments === 1 ? "" : "s"} available on this date.`
                : "No appointments are available on this date."}
            </p>
          )}
          {loadingServices && (
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
      <dialog
        className="appointment-confirmation-dialog"
        ref={confirmationDialogRef}
        aria-labelledby="appointment-confirmation-title"
        onClose={() => setAppointmentConfirmation(null)}
      >
        {appointmentConfirmation && (
          <div className="appointment-confirmation">
            <button
              className="service-dialog-close"
              type="button"
              aria-label="Close appointment confirmation"
              onClick={() => confirmationDialogRef.current?.close()}
            >
              &times;
            </button>
            <p className="booking-subtitle">BOOKING CONFIRMED</p>
            <h2 id="appointment-confirmation-title">Thank you for your booking</h2>
            <p className="appointment-confirmation-number">
              Appointment number: <strong>#{appointmentConfirmation.appointmentId}</strong>
            </p>
            <dl className="appointment-confirmation-summary">
              <div>
                <dt>Service</dt>
                <dd>
                  {appointmentConfirmation.serviceName || "Appointment"}
                  {appointmentConfirmation.categoryName
                    ? ` (${appointmentConfirmation.categoryName})`
                    : ""}
                </dd>
              </div>
              <div>
                <dt>Date and time</dt>
                <dd>
                  {new Date(
                    appointmentConfirmation.appointmentDateTime,
                  ).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt>Service price</dt>
                <dd>
                  €{Number(appointmentConfirmation.servicePrice).toFixed(2)}
                </dd>
              </div>
              <div>
                <dt>Deposit paid</dt>
                <dd>
                  €{Number(appointmentConfirmation.depositAmount).toFixed(2)}
                </dd>
              </div>
              <div>
                <dt>Payment status</dt>
                <dd>Paid</dd>
              </div>
              <div>
                <dt>Appointment status</dt>
                <dd>
                  {appointmentConfirmation.appointmentStatus.replaceAll("_", " ")}
                </dd>
              </div>
            </dl>
            <p className="appointment-confirmation-review">
              Keep your appointment number to leave a review after your visit.
            </p>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => confirmationDialogRef.current?.close()}
            >
              Done
            </button>
          </div>
        )}
      </dialog>
    </section>
  );
}



export default Booking;
