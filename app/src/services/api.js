import axios from 'axios';
import { refreshTokens, clearAuth } from './tokenRefresh';

const api = axios.create({
  // Dev uses a relative path so requests go through the Vite dev-server proxy
  // (see vite.config.js) -- this makes it work from localhost AND from a tablet
  // hitting the PC's LAN IP, with no self-signed-cert prompt on the device.
  baseURL: process.env.NODE_ENV !== 'production' ? '/api/' : 'https://api.willowdrive.com/api/',
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
  async (error) => {
    // Handle errors globally
    if (error.response) {
      const status = error.response.status;
      const config = error.config || {};
      const url = config.url ? String(config.url) : '';
      // A 401 from a normal API call = the access token expired. Try to silently
      // refresh it and replay the request once; only bounce to /login if the
      // refresh token is also dead. (login/refresh calls themselves are excluded
      // so we never recurse, and _retried guards against an infinite retry loop.)
      const isAuthCall = /(^|\/)(login|refresh)(\?|$)/i.test(url);
      if (status === 401 && !isAuthCall && !config._retried && typeof window !== 'undefined') {
        config._retried = true;
        const newToken = await refreshTokens();
        if (newToken) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${newToken}`;
          return api(config); // replay the original request transparently
        }
        // Refresh failed — genuinely logged out now.
        clearAuth();
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