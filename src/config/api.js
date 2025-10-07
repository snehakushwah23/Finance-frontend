// API configuration
const isDevelopment = import.meta.env.DEV;
const RENDER_BACKEND_URL = 'https://finance-backend-j9oh.onrender.com';

export const API_BASE_URL = isDevelopment 
  ? '' // Use Vite proxy in development
  : RENDER_BACKEND_URL; // Use Render URL in production

export const api = {
  get: (endpoint) => `${API_BASE_URL}${endpoint}`,
  post: (endpoint) => `${API_BASE_URL}${endpoint}`,
  put: (endpoint) => `${API_BASE_URL}${endpoint}`,
  delete: (endpoint) => `${API_BASE_URL}${endpoint}`,
};
