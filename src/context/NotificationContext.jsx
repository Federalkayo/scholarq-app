import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const TYPE_META = {
  fee: { icon: 'payments', accent: 'bg-amber-500' },
  attendance: { icon: 'event_busy', accent: 'bg-error' },
  announcement: { icon: 'campaign', accent: 'bg-primary' },
  system: { icon: 'notifications', accent: 'bg-secondary' },
};

export function iconForType(type) {
  return TYPE_META[type]?.icon || TYPE_META.system.icon;
}
export function accentForType(type) {
  return TYPE_META[type]?.accent || TYPE_META.system.accent;
}

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const hasLoadedOnce = useRef(false);
  const knownIds = useRef(new Set());

  useEffect(() => {
    hasLoadedOnce.current = false;
    knownIds.current = new Set();
    setNotifications([]);

    if (!currentUser) return undefined;

    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', currentUser.uid),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
          return tB - tA;
        });
      setNotifications(list);

      // Only pop toasts for docs that are genuinely new (skip the initial
      // batch that loads when the app first mounts / on refresh).
      if (hasLoadedOnce.current) {
        snap.docChanges().forEach((change) => {
          if (change.type === 'added' && !knownIds.current.has(change.doc.id)) {
            const data = change.doc.data();
            pushToast({ id: change.doc.id, ...data });
          }
        });
      }
      list.forEach((n) => knownIds.current.add(n.id));
      hasLoadedOnce.current = true;
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  const pushToast = useCallback((notification) => {
    const toastId = `${notification.id}-${Date.now()}`;
    setToasts((prev) => [...prev, { ...notification, toastId }]);
  }, []);

  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
    try {
      const markNotificationRead = httpsCallable(functions, 'markNotificationRead');
      await markNotificationRead({ notificationId });
    } catch (err) {
      // Fallback to a direct write if the callable isn't deployed yet.
      updateDoc(doc(db, 'notifications', notificationId), { read: true }).catch(() => {});
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, toasts, pushToast, dismissToast, markAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
}
