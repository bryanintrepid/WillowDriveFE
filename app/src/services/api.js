import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV !== 'production' ? 'https://localhost:7077/api/' : 'https://api.willowdrive.com/api/',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('token');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    if (error.response) {
      const status = error.response.status;
      const url = (error.config && error.config.url) ? String(error.config.url) : '';
      // 401 from anything other than the login call itself = expired/invalid token.
      // Clear stale auth and bounce to /login with redirect back to the current path.
      const isLoginRequest = /(^|\/)login(\?|$)/i.test(url);
      if (status === 401 && !isLoginRequest && typeof window !== 'undefined') {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } catch (e) { /* ignore storage errors */ }
        if (window.location.pathname !== '/login') {
          const redirect = window.location.pathname + window.location.search;
          window.location.assign('/login?redirect=' + encodeURIComponent(redirect));
        }
      }
      console.error('Response error:', status, error.response.data);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;