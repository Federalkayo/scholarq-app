import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { httpsCallable } from 'firebase/functions';
import { functions, firebaseConfig } from '../firebase';

// Generate your own key: Firebase Console > Project Settings > Cloud Messaging
// > Web configuration > Web Push certificates > "Generate key pair".
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

let messagingInstance = null;

async function getMessagingSafe() {
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  messagingInstance = getMessaging();
  return messagingInstance;
}

/**
 * Asks the browser for notification permission, registers the service
 * worker, grabs an FCM token, and saves it against the current user via
 * the `saveFcmToken` callable so Cloud Functions can push to them.
 * Returns the token on success, or null if permission was denied /
 * push isn't supported (e.g. Safari without a PWA install, or SSR).
 */
export async function enablePushNotifications() {
  const messaging = await getMessagingSafe();
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (token) {
    const saveFcmToken = httpsCallable(functions, 'saveFcmToken');
    await saveFcmToken({ token, platform: 'web' });
    localStorage.setItem('scholarq_fcm_token', token);
  }

  return token;
}

export async function disablePushNotifications() {
  const token = localStorage.getItem('scholarq_fcm_token');
  if (!token) return;
  const removeFcmToken = httpsCallable(functions, 'removeFcmToken');
  await removeFcmToken({ token }).catch(() => {});
  localStorage.removeItem('scholarq_fcm_token');
}

export function currentPermission() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

/**
 * Registers a listener for messages that arrive while this tab is open
 * and focused. Returns an unsubscribe function.
 */
export async function onForegroundMessage(callback) {
  const messaging = await getMessagingSafe();
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => callback(payload));
}
