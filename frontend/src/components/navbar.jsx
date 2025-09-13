import { Link } from "react-router-dom";
import React, { useState } from "react";
import styles from "./navbar.module.css";
import logo_light from "../assets/carlogo.png";
import search_icon_light from "../assets/search-w.png";
import search_icon_dark from "../assets/search-b.png";
import toogle_light from "../assets/night.png";
import toogle_dark from "../assets/day.png";
import menu_icon from "../assets/menuLogo.png";

const Navbar = ({ theme, setTheme }) => {
  const [isMenuOpen, setIsmenuOpen] = useState(false);

  const toggle_mode = () => {
    theme === "light" ? setTheme("dark") : setTheme("light");
  };

  const toggle_menu = () => {
    setIsmenuOpen(!isMenuOpen);
  };

  return (
    <div className={`${styles.navbar} ${theme === "dark" ? styles.dark : ""}`}>
      <img src={logo_light} alt="logo" className={styles.logo} />

      <ul>
        <li>
          <Link to="/" className={styles.navLink}>
            Home
          </Link>
        </li>
        <li>About Us</li>
        <li>Contact Us</li>
        <li>
          <Link to="/login" className={styles.navLink}>
            Login
          </Link>
        </li>
      </ul>

      <div className={styles.search}>
        <input type="text" placeholder="search" />
        <img
          src={theme === "light" ? search_icon_dark: search_icon_light}
          alt="search"
        />
      </div>

      <div className={styles.utility}>
        <img
          onClick={toggle_mode}
          src={theme === "light" ? toogle_dark: toogle_light}
          alt="toggle"
          className={styles.toggle}
        />
        <img
          onClick={toggle_menu}
          src={menu_icon}
          alt="menu"
          className={styles.menuIcon}
        />
      </div>

      {isMenuOpen && (
        <div
          className={`${styles.menu} ${
            theme === "dark" ? styles.menuDark : ""
          }`}
        >
          <ul>
            <li>Policies</li>
            <li>Payments</li>
            <li>Accidents</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Navbar;
