import { createContext, useContext, useState, useEffect } from 'react';
import { getStoredToken, setStoredAuth, clearStoredAuth } from '../api/client';

const USER_KEY = 'user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    const stored = localStorage.getItem(USER_KEY);
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch (_) {
        clearStoredAuth();
      }
    }
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

  const isAuthenticated = !!(getStoredToken() && user);
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
