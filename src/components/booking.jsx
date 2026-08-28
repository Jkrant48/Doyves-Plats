//this component handles the booking section of the website

function Booking() {
  return (
    <section className="booking" id="booking">
      <div className="booking-container">
        <div className="booking-heading">
          <p className="booking-subtitle">BOOKING</p>
          <h2 className="section-title">Book Your</h2>
          <h2 className="section-title1">Appointment</h2>
          <p className="section-description">
            Schedule your next visit and let us tailor a look that reflects your
            personality. We'll confirm your appointment shortly.
          </p>
        </div>
        <form className="booking-form">
          <div className="form-group">
            <label htmlFor="name">NAME</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter your full name"
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
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="service">PREFERRED SERVICE</label>
            <input
              type="text"
              id="service"
              name="service"
              placeholder="Enter your preferred service"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="checkin">SELECT AN AVAILABLE DATE</label>
            <input
              type="date"
              id="checkin"
              name="checkin"
              placeholder="mm/dd/yyyy"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="time">PREFERRED TIME</label>
            <input
              type="time"
              id="time"
              name="time"
              placeholder="hh:mm AM/PM"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Book Now
          </button>
          <p className="form-info">
            By booking, you agree to our booking and cancellation policy.
          </p>
        </form>
      </div>
    </section>
  );
}

export default Booking;
