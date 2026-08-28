//services component handles the services section of the website
import D10 from "../assets/d10.jpg";
import D2 from "../assets/d2.jpg";
import D11 from "../assets/d11.jpg";
import D12 from "../assets/d12.jpg";

function Services() {
  return (
    <section className="services" id="services">
      <div className="container">
        <p className="services-subtitle">What We Offer</p>
        <h3 className="section-title">Services Crafted</h3>
        <h3 className="section-title1">To Meet Your Needs</h3>
        <div className="services-grid">
          <div className="service-item">
            <img src={D11} alt="Pedicure & Manicure" />
            <h4 className="service-title">Pedicure & Manicure</h4>
            <p className="service-description">
              Refresh your hands and feet with professional nail care, shaping,
              cuticle treatment, and a polished finish.
            </p>
          </div>
          <div className="service-item">
            <img src={D2} alt="Hair Styling" />
            <h4 className="service-title">Braids</h4>
            <p className="service-description">
              Protective and stylish braided hairstyles customized to suit your
              look, lifestyle, and hair type.
            </p>
          </div>
          <div className="service-item">
            <img src={D12} alt="Waxing" />
            <h4 className="service-title">Waxing</h4>
            <p className="service-description">
              Enjoy smooth, long-lasting results with gentle waxing services for
              clean and confident skin.
            </p>
          </div>
          <div className="service-item">
            <img src={D10} alt="Eye Lashes" />
            <h4 className="service-title">Lashes</h4>
            <p className="service-description">
              Enhance your natural beauty with expertly applied lash extensions
              for a fuller, longer, and elegant look.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Services;
