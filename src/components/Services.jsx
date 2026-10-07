import { useEffect, useRef, useState } from "react";
import D10 from "../assets/d10.jpg";
import D2 from "../assets/d2.jpg";
import D11 from "../assets/d11.jpg";
import D12 from "../assets/d12.jpg";
import { readApiJson } from "../utils/api.js";

const categoryImages = {
  nails: D10,
  braids: D2,
  waxing: D12,
  lashes: D11,
};

const categoryDetails = {
  "pedicure & manicure": {
    image: D10,
    description:
      "Refresh your hands and feet with professional nail care, shaping, cuticle treatment, and a polished finish.",
  },
  braids: {
    image: D2,
    description:
      "Protective and stylish braided hairstyles customized to suit your look, lifestyle, and hair type.",
  },
  waxing: {
    image: D12,
    description:
      "Enjoy smooth, long-lasting results with gentle waxing services for clean and confident skin.",
  },
  lashes: {
    image: D11,
    description:
      "Enhance your natural beauty with expertly applied lash extensions for a fuller, longer, and elegant look.",
  },
};

async function fetchJson(url) {
  const response = await fetch(url);
  return readApiJson(response, "Unable to load services.");
}

function Services({ onSelectService }) {
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryServices, setCategoryServices] = useState([]);
  const [modalError, setModalError] = useState("");
  const [loadingCategory, setLoadingCategory] = useState(false);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    fetchJson("/api/categories")
      .then(({ categories: loadedCategories }) =>
        setCategories(loadedCategories),
      )
      .catch((error) => setCategoriesError(error.message))
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    if (!selectedCategory) return undefined;

    const dialog = dialogRef.current;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    if (dialog && !dialog.open) dialog.showModal();
    closeButtonRef.current?.focus();

    fetchJson(`/api/categories/${selectedCategory.id}/services`)
      .then(({ services }) => setCategoryServices(services))
      .catch((error) => setModalError(error.message))
      .finally(() => setLoadingCategory(false));

    return () => {
      if (dialog?.open) dialog.close();
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [selectedCategory]);

  function closeDialog() {
    if (dialogRef.current?.open) dialogRef.current.close();
    setSelectedCategory(null);
  }

  function openCategory(category) {
    setCategoryServices([]);
    setModalError("");
    setLoadingCategory(true);
    setSelectedCategory(category);
  }

  function selectService(serviceId) {
    onSelectService(serviceId);
    closeDialog();
  }

  return (
    <section className="services" id="services">
      <div className="container">
        <p className="services-subtitle">What We Offer</p>
        <h3 className="section-title">Services Crafted</h3>
        <h3 className="section-title1">To Meet Your Needs</h3>
        {categoriesError && (
          <p className="service-status" role="alert">
            {categoriesError}
          </p>
        )}
        {loadingCategories && (
          <p className="service-status" role="status">
            Loading service categories...
          </p>
        )}
        {!loadingCategories && !categoriesError && categories.length === 0 && (
          <p className="service-status" role="status">
            No service categories are currently available.
          </p>
        )}
        {categories.length > 0 && (
          <div className="services-grid">
            {categories.map((category) => (
              <button
                className="service-item"
                key={category.id}
                type="button"
                onClick={() => openCategory(category)}
                aria-haspopup="dialog"
              >
                <img
                  src={
                    categoryDetails[category.name.toLowerCase()]?.image ||
                    categoryImages[category.imageKey] ||
                    D11
                  }
                  alt=""
                />
                <h4 className="service-title">{category.name}</h4>
                <p className="service-description">
                  {categoryDetails[category.name.toLowerCase()]?.description ||
                    `Explore our ${category.name} services.`}
                </p>
                <span className="service-item-prompt">Book This</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedCategory && (
        <dialog
          className="service-dialog"
          ref={dialogRef}
          aria-labelledby="service-dialog-title"
          onClose={() => setSelectedCategory(null)}
          onClick={(event) => {
            if (event.target === dialogRef.current) closeDialog();
          }}
        >
          <div className="service-dialog-content">
            <button
              className="service-dialog-close"
              ref={closeButtonRef}
              type="button"
              onClick={closeDialog}
              aria-label="Close services"
            >
              &times;
            </button>
            <p className="services-subtitle">Starting Prices</p>
            <h2 className="service-dialog-title" id="service-dialog-title">
              {selectedCategory.name}
            </h2>
            {loadingCategory && <p role="status">Loading services...</p>}
            {modalError && <p role="alert">{modalError}</p>}
            {!loadingCategory &&
              !modalError &&
              categoryServices.length === 0 && (
                <p>No services are currently available in this category.</p>
              )}
            <div className="service-dialog-list">
              {categoryServices.map((service) => (
                <article className="service-dialog-item" key={service.id}>
                  <h3 className="service-dialog-item-name">{service.name}</h3>
                  {service.description && (
                    <p className="service-dialog-item-description">
                      {service.description}
                    </p>
                  )}
                  <p className="service-dialog-item-price">
                    €{Number(service.price).toFixed(2)}
                  </p>
                  <a
                    className="service-dialog-item-action"
                    type="button"
                    onClick={() => selectService(service.id)}
                  >
                    Select and book
                  </a>
                </article>
              ))}
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
}

export default Services;
