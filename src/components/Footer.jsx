//footer component--contains social media links and copyright information
import React from "react";

function Footer() {
  return (
    <footer>
      <div className="footer-container">
        <div className="footer-lg and text">
          {" "}
          <a href="#home">
            <h1>Doyves Plats</h1>
          </a>
          <p>
            {" "}
            Luxury beauty salon - braids, colors, transformations and
            exceptional care.
          </p>
        </div>
        <div className="social-icons">
          <a
            className="social-icon"
            href="https://www.tiktok.com/@serdave_naturelle?_r=1&_t=ZS-97hoZZYrMvM"
          >
            <i className="fa-brands fa-tiktok"></i>
          </a>

          <a className="social-icon" href="https://wa.me/+233204700813">
            <i className="fa-brands fa-whatsapp"></i>
          </a>

          <a
            className="social-icon"
            href="https://www.instagram.com/serdave_naturelle?igsh=MWp3MnNvY3UzdzVmeg=="
          >
            <i className="fa-brands fa-instagram"></i>
          </a>
        </div>
      </div>
      <hr />

      <p className="copyright">
        &copy; {new Date().getFullYear()} Doyves Plats. All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;
