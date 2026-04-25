import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from './api/axiosClient';

const AuthContext = createContext(null);

function normalizeRole(role) {
  return String(role || '').toLowerCase();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await api.get('/api/auth/me', { skipAuthRefresh: true });
      const payload = response.data;
      const normalizedUser = {
        ...payload,
        role: normalizeRole(payload?.role),
      };
      setUser(normalizedUser);
      localStorage.setItem('smartCampusUser', JSON.stringify(normalizedUser));
      return normalizedUser;
    } catch (error) {
      setUser(null);
      localStorage.removeItem('smartCampusUser');
      return null;
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('smartCampusUser');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({ ...parsed, role: normalizeRole(parsed.role) });
      } catch {
        localStorage.removeItem('smartCampusUser');
      }
    }

    refreshUser().finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    setUser,
    refreshUser,
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
