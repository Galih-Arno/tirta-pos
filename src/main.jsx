import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Daftarkan Service Worker PWA untuk mendukung Full Offline Mode
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Versi baru aplikasi tersedia');
  },
  onOfflineReady() {
    console.log('Aplikasi Tirta POS Siap Digunakan Full Offline!');
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);