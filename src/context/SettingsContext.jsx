import React, { createContext, useContext, useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, storage } from '../firebase';
import {
  mockStudentsList,
  mockFeeInvoices,
  dashboardKPIs,
  recentActivities,
  academicCalendarEvents,
  mockSectionPerformance
} from '../data/mockData';

const SETTINGS_STORAGE_KEY = 'scholarq_portal_settings';

const DEFAULT_SETTINGS = {
  profileData: {
    name: 'Dr. Sarah Jenkins',
    email: 's.jenkins@eduadmin.edu',
    title: 'Principal & Chief Administrator',
    phone: '+1 (555) 019-2834',
    bio: 'Overseeing academic excellence and administrative operations for Academic Year 2023-24.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'
  },
  schoolData: {
    schoolName: 'EduAdmin Academy & High School',
    academicYear: '2023-2024',
    address: '742 Evergreen Terrace, Springfield',
    emergencyPhone: '+1 (555) 911-0000',
    contactEmail: 'admin@eduadmin.edu'
  },
  notifications: {
    attendanceDigest: true,
    feeAlerts: true,
    emergencySms: true,
    weeklyReportEmail: false
  },
  security: {
    twoFactor: true,
    sessionTimeout: '30m'
  },
  theme: {
    darkMode: false,
    compactTable: false
  }
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          profileData: { ...DEFAULT_SETTINGS.profileData, ...(parsed.profileData || {}) },
          schoolData: { ...DEFAULT_SETTINGS.schoolData, ...(parsed.schoolData || {}) },
          notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed.notifications || {}) },
          security: { ...DEFAULT_SETTINGS.security, ...(parsed.security || {}) },
          theme: { ...DEFAULT_SETTINGS.theme, ...(parsed.theme || {}) }
        };
      }
    } catch (e) {
      console.error('Failed to parse saved settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Sync settings with Firestore in real-time if document exists
  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'portal');
    const unsubscribe = onSnapshot(
      settingsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const remoteData = docSnap.data();
          setSettings((prev) => ({
            profileData: { ...prev.profileData, ...(remoteData.profileData || {}) },
            schoolData: { ...prev.schoolData, ...(remoteData.schoolData || {}) },
            notifications: { ...prev.notifications, ...(remoteData.notifications || {}) },
            security: { ...prev.security, ...(remoteData.security || {}) },
            theme: { ...prev.theme, ...(remoteData.theme || {}) }
          }));
        }
      },
      (err) => {
        if (err.code === 'permission-denied') {
          console.info('Firestore settings note: /settings/portal read access requires Firestore Rules update.');
        } else {
          console.warn('Firestore settings listener notice:', err.message);
        }
      }
    );
    return unsubscribe;
  }, []);

  const saveSettings = async (newSettingsPartial) => {
    const updated = {
      profileData: { ...settings.profileData, ...(newSettingsPartial?.profileData || {}) },
      schoolData: { ...settings.schoolData, ...(newSettingsPartial?.schoolData || {}) },
      notifications: { ...settings.notifications, ...(newSettingsPartial?.notifications || {}) },
      security: { ...settings.security, ...(newSettingsPartial?.security || {}) },
      theme: { ...settings.theme, ...(newSettingsPartial?.theme || {}) }
    };

    // 1. Update React state instantly for responsive UI
    setSettings(updated);

    // 2. Save to local storage
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }

    // 3. Persist to Cloud Firestore doc: settings/portal
    try {
      const settingsDocRef = doc(db, 'settings', 'portal');
      await setDoc(settingsDocRef, updated, { merge: true });
      console.log('Settings successfully saved to Firestore doc: settings/portal');
    } catch (err) {
      if (err.code === 'permission-denied') {
        console.info('Firestore settings note: Saved locally. To sync with Firestore, update Firestore Rules in Firebase Console.');
      } else {
        console.error('Failed to save settings to Firestore:', err);
      }
    }
  };

  /**
   * Uploads an avatar image to Firebase Storage and saves the URL to Firestore & state.
   */
  const updateAvatar = async (file) => {
    if (!file) return null;

    try {
      // 1. Upload to Firebase Storage bucket
      const storageRef = ref(storage, `avatars/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      
      // 2. Obtain download URL
      const downloadUrl = await getDownloadURL(snapshot.ref);

      // 3. Save download URL to settings in Firestore and local state
      await saveSettings({
        profileData: { ...settings.profileData, avatar: downloadUrl }
      });

      return downloadUrl;
    } catch (firebaseError) {
      console.warn('Firebase Storage upload notice (falling back to DataURL):', firebaseError);

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target.result;
          await saveSettings({
            profileData: { ...settings.profileData, avatar: dataUrl }
          });
          resolve(dataUrl);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    }
  };

  const exportDatabaseBackup = () => {
    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      settings,
      students: mockStudentsList,
      invoices: mockFeeInvoices,
      dashboardKPIs,
      recentActivities,
      academicEvents: academicCalendarEvents,
      sectionPerformance: mockSectionPerformance
    };
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `scholarq_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        saveSettings,
        updateAvatar,
        exportDatabaseBackup
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
