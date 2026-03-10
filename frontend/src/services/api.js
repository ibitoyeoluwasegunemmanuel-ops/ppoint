import axios from 'axios';

const resolveApiBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window === 'undefined') {
    return '/api';
  }

  const { hostname } = window.location;

  if (hostname === '127.0.0.1' || hostname === 'localhost') {
    return 'http://127.0.0.1:3000/api';
  }

  return '/api';
};

const api = axios.create({
  baseURL: resolveApiBaseUrl()
});

export default api;