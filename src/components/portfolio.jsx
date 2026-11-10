import { useEffect, useState } from "react";
import { readApiJson } from "../utils/api.js";

function Portfolio() {
  const [databaseItems, setDatabaseItems] = useState([]);

  useEffect(() => {
    let active = true;

    fetch("/api/portfolio")
      .then((response) =>
        readApiJson(response, "Unable to load portfolio images."),
      )
      .then(({ images }) => {
        if (active) setDatabaseItems(images);
      })
      .catch((error) => {
        if (active) console.error("Unable to load portfolio images.", error);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="portfolio" id="portfolio">
      <p className="portfolio-subtitle">OUR WORK</p>
      <h3 className="portfolio-title">Portfolio</h3>
      <div className="portfolio-grid">
        {databaseItems.map((item) => (
          <div className="portfolio-item" key={item.id}>
            <img
              src={item.imageUrl}
              alt={item.altText || item.title || "Portfolio work"}
            />
            <div className="portfolio-item-details">
              <h4>{item.title}</h4>
              <p className="portfolio-item-service">
                {item.categoryName} · {item.serviceName}
              </p>
              {item.description && <p>{item.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Portfolio;
