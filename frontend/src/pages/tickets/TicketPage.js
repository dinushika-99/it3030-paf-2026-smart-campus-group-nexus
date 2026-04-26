import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TicketManager from './TicketManager';
import './TicketPage.css';

export default function TicketPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  const initialRoomId = new URLSearchParams(location.search).get('roomId') || '';

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
            Back
          </button> 
        </div>
      </div>

      <TicketManager user={user} initialRoomId={initialRoomId} />
    </div>
  );
}