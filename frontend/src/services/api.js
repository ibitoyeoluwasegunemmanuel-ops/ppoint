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

  if (hostname === 'ppoint.online' || hostname === 'www.ppoint.online') {
    return 'https://api.ppoint.online/api';
  }

  return '/api';
};

const api = axios.create({
  baseURL: resolveApiBaseUrl()
});

export default api;