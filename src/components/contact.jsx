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
              123 Beauty Boulevard Suite 400, Downtown New York, NY 10001
            </p>
          </div>
          <div className="contact-item">
            <h3 className="contact-item-title">PHONE & MAIL</h3>
            <p className="contact-item-description">(123) 456-7890</p>
            <p className="contact-item-description">hello@beautysalon.com</p>
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
