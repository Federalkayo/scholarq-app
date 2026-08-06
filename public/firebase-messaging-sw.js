/* eslint-disable no-undef */
// Firebase Cloud Messaging background service worker.
// Handles push notifications that arrive while the ScholarQ tab is
// closed or backgrounded. Foreground messages (tab open/focused) are
// instead handled in src/lib/messaging.js and rendered as the in-app
// Claude-style toast, so this file only needs the background case.

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

  self.registration.showNotification(title || "ScholarQ", {
    body: body || "",
    icon: "/scholarq-icon.png",
    badge: "/scholarq-icon.png",
    data: { link },
    tag: payload.data?.type || "scholarq-notification",
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
