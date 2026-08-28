//this is the about page of the website
import D1 from "../assets/d1.jpg";
function About() {
  return (
    <section className="about" id="about">
      <div className="about-content">
        <p className="about-subtitle">ABOUT DOYVES PLATS</p>
        <h3 className="about-title">From a Vision</h3>
        <h3 className="about-title1">To Reality</h3>
        <p className="about-description">
          Welcome to Doyves Plats, where beauty, creativity, and exceptional
          care come together. We believe that every client deserves a hairstyle
          that reflects their personality and enhances their confidence. Our
          team is dedicated to providing professional hair care services in a
          clean, comfortable, and welcoming environment. Whether you're looking
          for stylish braids, elegant locs, protective styles, wig installation,
          hair treatments, or a complete transformation, we take the time to
          understand your preferences and deliver results tailored to you. At
          Doyves Plats, we use quality products, stay updated with the latest
          trends and techniques, and prioritize the health of your natural hair.
          Every appointment is an opportunity to provide outstanding styling and
          a relaxing, enjoyable experience.
        </p>
      </div>
      <div className="about-image">
        <img src={D1} alt="Nail technician working" />
      </div>
    </section>
  );
}

export default About;
