import { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import Portfolio from "./components/portfolio";
import About from "./components/About";
import Services from "./components/Services";
import Review from "./components/Review";
import Booking from "./components/booking";
import Contact from "./components/contact";

function App() {
  const [selectedServiceId, setSelectedServiceId] = useState("");

  function selectServiceAndNavigate(serviceId) {
    setSelectedServiceId(String(serviceId));
    requestAnimationFrame(() => {
      document.getElementById("booking")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      document.getElementById("serviceId")?.focus({ preventScroll: true });
    });
  }

  return (
    <>
      <Header />
      <Hero />
      <About />
      <Services onSelectService={selectServiceAndNavigate} />
      <Portfolio />
      <Review />
      <hr className="review-booking-divider" />
      <Booking
        selectedServiceId={selectedServiceId}
        onServiceChange={setSelectedServiceId}
      />
      <Contact />
      <Footer />
    </>
  );
}

export default App;
