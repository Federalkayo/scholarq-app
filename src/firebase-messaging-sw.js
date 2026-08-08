/* eslint-disable no-undef */
// Combined service worker for ScholarQ / EduAdmin Pro.
//
// This single file does two jobs that both need to run in the
// service worker context, so they're merged here instead of using
// two separate registrations (which would fight over the same scope):
//
//   1. PWA offline support — precaches the built app shell via Workbox,
//      injected automatically by vite-plugin-pwa at build time.
//   2. Firebase Cloud Messaging — handles push notifications that
//      arrive while the tab is closed or backgrounded. Foreground
//      messages are handled separately in src/lib/messaging.js.
//
// Registered from src/lib/messaging.js as '/firebase-messaging-sw.js'
// (vite-plugin-pwa is configured to build this file to that filename).

import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCCE98UtiFAWH6Jk0fkK8o9eA96dswlFvM",
  authDomain: "scholarq-cf796.firebaseapp.com",
  projectId: "scholarq-cf796",
  storageBucket: "scholarq-cf796.firebasestorage.app",
  messagingSenderId: "979849132863",
  appId: "1:979849132863:web:e668edccf77aaa4f88b18a",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  const link = payload.fcmOptions?.link || payload.data?.route || "/";
  const type = payload.data?.type || "scholarq-notification";

  self.registration.showNotification(title || "ScholarQ", {
    body: body || "",
    icon: "/scholarq-icon.png",
    badge: "/scholarq-icon.png",
    data: { link },
    // Unique per-notification tag (type + timestamp) so each push still pops up
    // and re-alerts (sound/banner) even when several of the same type arrive in
    // a row. Using just `type` as the tag made every 2nd+ notification of the
    // same kind (e.g. "attendance") silently replace the previous one instead
    // of showing — that's what was causing notifications to "show once and stop".
    tag: `${type}-${Date.now()}`,
    renotify: true,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(link);
    })
  );
});

// Activate the updated service worker immediately rather than waiting
// for all tabs to close — keeps the offline cache and push handling current.
self.skipWaiting();
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});