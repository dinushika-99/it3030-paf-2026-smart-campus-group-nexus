import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TicketManager from './TicketManager';
import './TicketPage.css';

export default function TicketPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('smartCampusUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  if (!user) {
    return <div className="ticket-page-loading">Loading...</div>;
  }

  return (
    <div className="ticket-page-root">
      <div className="ticket-page-header">
        <h2 className="ticket-page-title">Your Tickets</h2>
        <div className="ticket-page-actions">
          <button type="button" className="ticket-nav-btn" onClick={() => navigate('/dashboard')}>
            Home
          </button>
        </div>
      </div>

      <TicketManager user={user} />
    </div>
  );
}