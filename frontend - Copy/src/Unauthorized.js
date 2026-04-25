import React from 'react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#111827', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '520px' }}>
        <h1 style={{ marginTop: 0, marginBottom: '8px' }}>403 Unauthorized</h1>
        <p style={{ marginTop: 0, marginBottom: '20px', color: '#4b5563' }}>
          You do not have permission to access this page.
        </p>
        <Link to="/dashboard" style={{ display: 'inline-block', textDecoration: 'none', background: '#111827', color: '#fff', padding: '10px 16px', borderRadius: '8px', fontWeight: 600 }}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
