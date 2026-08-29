import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sp_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);

  // Re-validate the stored token on page load
  useEffect(() => {
    const token = localStorage.getItem('sp_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        setPharmacy(data.pharmacy || null);
        localStorage.setItem('sp_user', JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem('sp_token');
        localStorage.removeItem('sp_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveSession = (data) => {
    localStorage.setItem('sp_token', data.token);
    localStorage.setItem('sp_user', JSON.stringify(data.user));
    setUser(data.user);
    setPharmacy(data.pharmacy || null);
    return data.user;
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return saveSession(data);
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return saveSession(data);
  };

  const logout = () => {
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_user');
    setUser(null);
    setPharmacy(null);
  };

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem('sp_user', JSON.stringify(updated));
  };

  // Where each role lands after login
  const homeFor = (role) =>
    role === 'admin' ? '/admin/dashboard' : role === 'pharmacy' ? '/pharmacy/dashboard' : '/user/dashboard';

  return (
    <AuthContext.Provider
      value={{ user, pharmacy, setPharmacy, loading, login, register, logout, updateUser, homeFor }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
