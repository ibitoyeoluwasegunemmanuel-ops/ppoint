import axios from 'axios';

const resolveApiBaseUrl = () => {
  // Safe environment variable checked to prevent Vite crashes
  let configuredUrl = '';
  
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      configuredUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.NEXT_PUBLIC_API_URL || import.meta.env.VITE_API_URL;
    }
  } catch (err) {
    // Ignore
  }

  // Backup check in case process.env is somehow injected by a bundler/Vercel
  try {
    if (!configuredUrl && typeof process !== 'undefined' && process.env) {
      configuredUrl = process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_BASE_URL;
    }
  } catch (err) {
    // Ignore
  }

  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window === 'undefined') {
    return '/api';
  }

  const { hostname, origin } = window.location;

  if (hostname === '127.0.0.1' || hostname === 'localhost') {
    return 'http://127.0.0.1:3000/api';
  }

  return `${origin}/api`;
};

const api = axios.create({
  baseURL: resolveApiBaseUrl()
});

export default api;