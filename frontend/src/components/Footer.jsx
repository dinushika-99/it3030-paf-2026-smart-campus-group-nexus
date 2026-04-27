import React from "react";
import { Link } from "react-router-dom";
import { SITE_BRAND } from "../siteConfig";
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="footer-brand">
          <Link to="/dashboard" className="footer-logo">
            <img src={SITE_BRAND.logoPath} alt={SITE_BRAND.logoAlt} />
            <span>{SITE_BRAND.name}</span>
          </Link>

          <p>
            Smart Campus helps students and lecturers manage resources,
            bookings, maintenance tickets, and campus services easily.
          </p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <Link to="/dashboard">Home</Link>
          <Link to="/facilities">Facilities</Link>
          <Link to="/bookings/my">My Bookings</Link>
          <Link to="/tickets">Tickets</Link>
        </div>

        <div className="footer-section">
          <h4>Support</h4>
          <p>NEXUS Student Services</p>
          <p>+94 11 234 5678</p>
          <p>support@nexus.edu.lk</p>
          <p>Mon-Fri, 8:30 AM - 4:30 PM</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {year} {SITE_BRAND.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}