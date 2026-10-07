//component for the header
import { useState } from "react";
import LanguageSelector from "./language";

function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header>
      <div className="header-container">
        <a href="#home" onClick={closeMenu}>
          <h1>Doyves Plats</h1>
        </a>
        <button className="menu-btn" onClick={toggleMenu}>
          MENU
        </button>
        <ul className={`nav-links ${isOpen ? "open" : ""}`}>
          <li>
            <a href="#home" onClick={closeMenu}>
              Home
            </a>
          </li>
          <li>
            <a href="#about" onClick={closeMenu}>
              About
            </a>
          </li>
          <li>
            <a href="#services" onClick={closeMenu}>
              Services
            </a>
          </li>
          <li>
            <a href="#portfolio" onClick={closeMenu}>
              Portfolio
            </a>
          </li>
          <li>
            <a className="contact-link" href="#contact" onClick={closeMenu}>
              Contact
            </a>
          </li>
        </ul>
        <LanguageSelector />
      </div>
    </header>
  );
}

export default Header;
