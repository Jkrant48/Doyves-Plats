//this component contains the contact section of the website

function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="contact-container">
        <div className="contact-heading">
          <p className="contact-subtitle">CONTACT</p>
          <h2 className="section-title">Get In</h2>
          <h2 className="section-title1">Touch</h2>
          <p className="section-description">
            Have any questions or need assistance? Feel free to reach out to us!
          </p>
        </div>
        <div className="contact-info">
          <div className="contact-item">
            <h3 className="contact-item-title">ADDRESS</h3>
            <p className="contact-item-description">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Wolffintie%2036%2C%20Vaasa%2C%20Finland"
                target="_blank"
                rel="noreferrer"
                aria-label="Open Wolffintie 36 in Google Maps"
              >
                Wolffintie 36, Wasa Sport Club, Vaasa, Finland
              </a>
            </p>
          </div>
          <div className="contact-item">
            <h3 className="contact-item-title">PHONE & MAIL</h3>
            <p className="contact-item-description">
              <a href="tel:+35849894587">+358 498 945 87</a>
            </p>
            <p className="contact-item-description">
              <a href="mailto:hello@beautysalon.com">hello@beautysalon.com</a>
            </p>
          </div>
          <div className="contact-item">
            <h3 className="contact-item-title">OPERATING HOURS</h3>
            <p className="contact-item-description">
              Monday - Friday: 9AM - 6PM
            </p>
            <p className="contact-item-description">Saturday: 10AM - 4PM</p>
            <p className="contact-item-description">Sunday: Closed</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
