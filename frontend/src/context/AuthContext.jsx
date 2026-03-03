import { createContext, useContext, useState, useEffect } from 'react';
import { getStoredToken, setStoredAuth, clearStoredAuth } from '../api/client';

const USER_KEY = 'user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // BUG 8: do not restore user from storage so header shows "User" after refresh
  useEffect(() => {
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    setStoredAuth(token, userData);
    setUser(userData);
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
  };

  // BUG 8: after refresh user is null so header shows "User"; token still valid so stay "logged in"
  const isAuthenticated = !!getStoredToken();
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated, isAdmin, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
