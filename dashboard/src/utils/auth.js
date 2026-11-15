import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from './api';

const AuthContext = createContext(null);

const ROLES_HIERARCHY = {
  admin: 4,
  nodal_officer: 3,
  analyst: 2,
  viewer: 1,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('profileguard_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('profileguard_token'));
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!token && !!user;

  const login = useCallback(async (email, password, totpCode = null) => {
    setLoading(true);
    try {
      const payload = { email, password };
      if (totpCode) payload.totp_code = totpCode;

      const response = await api.post('/auth/login', payload);
      const { access_token, user: userData } = response.data;

      localStorage.setItem('profileguard_token', access_token);
      localStorage.setItem('profileguard_user', JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      // If 2FA required, signal to the UI
      if (error.response?.status === 403 && error.response?.data?.requires_2fa) {
        return { success: false, requires2FA: true, message: '2FA code required' };
      }
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('profileguard_token');
    localStorage.removeItem('profileguard_user');
    setToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (requiredRole) => {
      if (!user) return false;
      return (ROLES_HIERARCHY[user.role] || 0) >= (ROLES_HIERARCHY[requiredRole] || 0);
    },
    [user]
  );

  const hasExactRole = useCallback(
    (role) => {
      if (!user) return false;
      return user.role === role;
    },
    [user]
  );

  // Refresh user info on mount if token exists
  useEffect(() => {
    if (token && !user) {
      api
        .get('/auth/me')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('profileguard_user', JSON.stringify(res.data));
        })
        .catch(() => {
          // Token invalid
          localStorage.removeItem('profileguard_token');
          localStorage.removeItem('profileguard_user');
          setToken(null);
          setUser(null);
        });
    }
  }, [token, user]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    hasRole,
    hasExactRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
