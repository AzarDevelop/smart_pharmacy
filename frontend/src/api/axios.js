import axios from 'axios';

// One axios instance for the whole app. The base URL comes from .env
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Send the user back to login if the token has expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('sp_token')) {
      localStorage.removeItem('sp_token');
      localStorage.removeItem('sp_user');
      if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Turns any axios error into a plain message the UI can show
export const getError = (error) =>
  error?.response?.data?.message || error?.message || 'Something went wrong. Try again.';

export default api;
