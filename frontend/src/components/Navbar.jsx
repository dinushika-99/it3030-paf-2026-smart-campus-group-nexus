import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { SITE_BRAND } from "../siteConfig";

export default function Navbar({ user }) {
  const navigate = useNavigate();

  // ✅ fallback safe user
  const safeUser = user || { name: "User" };

  // ✅ simple color fallback (since COLORS was undefined)
  const COLORS = {
    purple: "#7c3aed"
  };

  // ✅ optional avatar (can extend later)
  const profileAvatarUrl = safeUser?.avatar || null;

  // ✅ open profile handler
  const openProfile = () => {
    navigate("/profile");
  };

  const logout = () => {
    localStorage.removeItem("smartCampusUser");
    navigate("/login");
  };

  return (
    <nav className="app-navbar">
      <Link to="/dashboard" className="app-navbar-brand">
        <img src={SITE_BRAND.logoPath} alt={SITE_BRAND.logoAlt} />
        <h1>{SITE_BRAND.name}</h1>
      </Link>

      <div className="app-navbar-links">
        <Link to="/dashboard">Home</Link>
        <Link to="/facilities">Facilities</Link>
        <Link to="/bookings/my">Bookings</Link>
        <Link to="/tickets">Tickets</Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'center', display: 'grid', justifyItems: 'center' }}>
            <button
              onClick={openProfile}
              title="Open profile"
              style={{ width: '40px', height: '40px', borderRadius: '999px', border: 'none', background: COLORS.purple, color: '#fff', fontWeight: 700, cursor: 'pointer', overflow: 'hidden', display: 'grid', placeItems: 'center', padding: 0 }}
            >
              {profileAvatarUrl
                ? <img src={profileAvatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (user.name || 'U').charAt(0).toUpperCase()}
            </button>
            <button
              onClick={openProfile}
              style={{ margin: '3px 0 0 0', padding: 0, border: 'none', background: 'transparent', fontSize: '12px', fontWeight: '700', color: '#111827', cursor: 'pointer', lineHeight: 1.1 }}
            >
              {user.name}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}