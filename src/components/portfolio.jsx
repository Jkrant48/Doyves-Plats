//this componet handles the portfolio section of the website
//later the pictures can be displayed dynamically from a database or an api
import d3 from "../assets/d3.jpg";
import d4 from "../assets/d4.jpg";
import d6 from "../assets/d6.jpg";
import d7 from "../assets/d7.jpg";
import d8 from "../assets/d8.jpg";
import d9 from "../assets/d9.jpg";

function Portfolio() {
  return (
    <section className="portfolio" id="portfolio">
      <p className="portfolio-subtitle">OUR WORK</p>
      <h3 className="portfolio-title">Portfolio</h3>
      <div className="portfolio-grid">
        <div className="portfolio-item">
          <img src={d3} alt="Project 1" />
        </div>
        <div className="portfolio-item">
          <img src={d4} alt="Project 2" />
        </div>
        <div className="portfolio-item">
          <img src={d6} alt="Project 3" />
        </div>
        <div className="portfolio-item">
          <img src={d7} alt="Project 4" />
        </div>
        <div className="portfolio-item">
          <img src={d8} alt="Project 5" />
        </div>
        <div className="portfolio-item">
          <img src={d9} alt="Project 6" />
        </div>
      </div>
    </section>
  );
}

export default Portfolio;
