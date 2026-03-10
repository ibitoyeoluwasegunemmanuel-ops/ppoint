import axios from 'axios';

const PRODUCTION_API_FALLBACKS = [
  'https://api.ppoint.online/api',
  'https://api.ppoint.africa/api',
  'https://ppoint-api.onrender.com/api'
];

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

  if (hostname === 'ppoint.africa' || hostname === 'www.ppoint.africa') {
    return 'https://api.ppoint.africa/api';
  }

  if (hostname === 'ppoint.online' || hostname === 'www.ppoint.online') {
    return 'https://api.ppoint.online/api';
  }

  return PRODUCTION_API_FALLBACKS[0];
};

const api = axios.create({
  baseURL: resolveApiBaseUrl()
});

export default api;