import d3 from "../assets/d3.jpg";
import d4 from "../assets/d4.jpg";
import d6 from "../assets/d6.jpg";
import d7 from "../assets/d7.jpg";
import d8 from "../assets/d8.jpg";
import d9 from "../assets/d9.jpg";
import d1 from "../assets/d1.jpg";
import { useEffect, useState } from "react";
import { readApiJson } from "../utils/api.js";

const placeholderItems = [
  { id: "work-1", image: d3, alt: "Portfolio work 1" },
  { id: "work-2", image: d4, alt: "Portfolio work 2" },
  { id: "work-3", image: d6, alt: "Portfolio work 3" },
  { id: "work-4", image: d7, alt: "Portfolio work 4" },
  { id: "work-5", image: d8, alt: "Portfolio work 5" },
  { id: "work-6", image: d9, alt: "Portfolio work 6" },
  { id: "work-7", image: d1, alt: "Portfolio work 7" },
];

function Portfolio() {
  const [databaseItems, setDatabaseItems] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/portfolio")
      .then((response) => readApiJson(response, "Unable to load portfolio images."))
      .then(({ images }) => {
        if (active) setDatabaseItems(images);
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      });

    return () => {
      active = false;
    };
  }, []);

  const portfolioItems = [
    ...placeholderItems,
    ...databaseItems.map((image) => ({
      id: `database-${image.id}`,
      image: image.imageUrl,
      alt: image.altText || "Portfolio work",
    })),
  ];

  return (
    <section className="portfolio" id="portfolio">
      <p className="portfolio-subtitle">OUR WORK</p>
      <h3 className="portfolio-title">Portfolio</h3>
      {loadError && (
        <p className="portfolio-status" role="status">
          {loadError} Showing the sample gallery.
        </p>
      )}
      <div className="portfolio-grid">
        {portfolioItems.map((item) => (
          <div className="portfolio-item" key={item.id}>
            <img src={item.image} alt={item.alt} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default Portfolio;
