import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Komponen utama aplikasi kita
import './index.css'; // Atau style.css (file CSS utama tempat Tailwind diimpor)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);