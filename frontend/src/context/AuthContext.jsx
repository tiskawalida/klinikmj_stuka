import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('kmj_token'));
  const [loading, setLoading] = useState(true);

  // Setup axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Verify token on load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await axios.get(`${API_URL}/auth/me`);
        setUser(res.data.user);
      } catch {
        localStorage.removeItem('kmj_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const login = useCallback(async (username, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { username, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('kmj_token', newToken);
    setToken(newToken);
    setUser(newUser);
    return res.data;
  }, []);

  const register = useCallback(async (data) => {
    const res = await axios.post(`${API_URL}/auth/register`, data);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('kmj_token', newToken);
    setToken(newToken);
    setUser(newUser);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try { await axios.post(`${API_URL}/auth/logout`); } catch (_) {}
    localStorage.removeItem('kmj_token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
