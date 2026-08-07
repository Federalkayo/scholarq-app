import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Registers /firebase-messaging-sw.js on load (not gated behind push
// permission) so the browser can offer "Add to Home Screen" / install
// prompts, and the app shell is precached for offline use. The same
// service worker also handles FCM background push once a user opts in
// via enablePushNotifications() in src/lib/messaging.js — registering
// it here first just means that later call reuses this registration.
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
