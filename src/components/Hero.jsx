// Hero component
import HeroImage from "../assets/hero.jpg";

const Hero = () => {
  return (
    <section
      className="hero"
      id="home"
      style={{ backgroundImage: `url(${HeroImage})` }}
    >
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <p className="hero-subtitle">DOYVES PLATS - EST 2025</p>
        <h2 className="hero-heading">WHERE HAIR</h2>
        <h2 className="hero-heading2">Becomes Art</h2>
        <p className="hero-description">
          Unique braids, transformative colors and designs crafted for you.
        </p>
        <div className="hero-buttons">
          <a className="btn btn-primary" href="#booking">
            Book Now
          </a>
          <a className="btn btn-secondary" href="#portfolio">
            View Portfolio
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
