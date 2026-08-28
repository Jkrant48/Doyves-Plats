import React from "react";
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
  return (
    <>
      <Header />
      <Hero />
      <About />
      <Services />
      <Portfolio />
      <Review />
      <hr className="review-booking-divider" />
      <Booking />
      <Contact />
      <Footer />
    </>
  );
}

export default App;
