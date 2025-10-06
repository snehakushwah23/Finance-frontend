import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import axios from 'axios';

// Configure axios base URL:
// - In development, Vite proxy handles '/api' to localhost:5000
// - In production (Netlify), set VITE_API_URL to your backend URL (https://your-backend.example.com)
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
