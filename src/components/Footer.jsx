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
            href="https://www.tiktok.com/@doyvesplats_24?_r=1&_t=ZN-99KgMya1gLW"
          >
            <i className="fa-brands fa-tiktok"></i>
          </a>

          <a className="social-icon" href="https://wa.me/+358449458004">
            <i className="fa-brands fa-whatsapp"></i>
          </a>

          <a
            className="social-icon"
            href="https://www.instagram.com/doyves_plats_?igsi=YWN0ejluMHhoYTE2&utm_source=qr"
          >
            <i className="fa-brands fa-instagram"></i>
          </a>
          <a
            className="social-icon"
            href="https://www.facebook.com/share/1Jv3rEUC9G/?mibextid=wwXIfr"
          >
            <i className="fa-brands fa-facebook"></i>
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
