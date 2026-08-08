import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { createInviteCode, getInviteCodes } from '../services/inviteService';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function Settings() {
  const { userProfile, currentUser, refreshProfile } = useAuth();
  const isTeacher = userProfile?.role === 'teacher';

  const { settings, saveSettings, updateAvatar, exportDatabaseBackup } = useSettings();
  const [activeTab, setActiveTab] = useState('profile');
  const [savedNotice, setSavedNotice] = useState(false);
  const fileInputRef = useRef(null);

  // Form State
  const [profileData, setProfileData] = useState(() => ({
    name: userProfile?.name || settings.profileData.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User',
    email: userProfile?.email || currentUser?.email || settings.profileData.email || '',
    title: userProfile?.title || (isTeacher ? `Teacher (${(userProfile?.assignedClasses || ['Class 10A']).join(', ')})` : settings.profileData.title || 'Principal & Chief Administrator'),
    phone: userProfile?.phone || settings.profileData.phone || '',
    bio: userProfile?.bio || settings.profileData.bio || '',
    avatar: userProfile?.avatar || settings.profileData.avatar || ''
  }));
  const [schoolData, setSchoolData] = useState(settings.schoolData);
  const [notifications, setNotifications] = useState(settings.notifications);
  const [security, setSecurity] = useState(settings.security);
  const [theme, setTheme] = useState(settings.theme);

  useEffect(() => {
    if (userProfile || currentUser) {
      setProfileData({
        name: userProfile?.name || settings.profileData.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User',
        email: userProfile?.email || currentUser?.email || settings.profileData.email || '',
        title: userProfile?.title || (isTeacher ? `Teacher (${(userProfile?.assignedClasses || ['Class 10A']).join(', ')})` : settings.profileData.title || 'Principal & Chief Administrator'),
        phone: userProfile?.phone || settings.profileData.phone || '',
        bio: userProfile?.bio || settings.profileData.bio || '',
        avatar: userProfile?.avatar || settings.profileData.avatar || ''
      });
    }
    setSchoolData(settings.schoolData);
    setNotifications(settings.notifications);
    setSecurity(settings.security);
    setTheme(settings.theme);
  }, [settings, userProfile, currentUser, isTeacher]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    await saveSettings({
      profileData,
      schoolData,
      notifications,
      security,
      theme
    });

    if (currentUser?.uid) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          name: profileData.name,
          email: profileData.email,
          title: profileData.title,
          phone: profileData.phone,
          bio: profileData.bio,
          avatar: profileData.avatar
        }, { merge: true });
        if (refreshProfile) await refreshProfile();
      } catch (err) {
        console.error('Failed to sync profile to users collection:', err);
      }
    }

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const dataUrl = await updateAvatar(file);
      if (dataUrl) {
        setProfileData((prev) => ({ ...prev, avatar: dataUrl }));
        if (currentUser?.uid) {
          await setDoc(doc(db, 'users', currentUser.uid), { avatar: dataUrl }, { merge: true });
          if (refreshProfile) await refreshProfile();
        }
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3000);
      }
    }
  };

  const handleNotificationToggle = (key, value) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    saveSettings({ notifications: updated });
  };

  const handleSecurityChange = (key, value) => {
    const updated = { ...security, [key]: value };
    setSecurity(updated);
    saveSettings({ security: updated });
  };

  const handleThemeToggle = (key, value) => {
    const updated = { ...theme, [key]: value };
    setTheme(updated);
    saveSettings({ theme: updated });
  };

  const [inviteCodesList, setInviteCodesList] = useState([]);
  const [newCodeSuccess, setNewCodeSuccess] = useState(null);
  const [selectedHours, setSelectedHours] = useState(48);
  const [selectedClass, setSelectedClass] = useState('Class 10A');
  const [generatingCode, setGeneratingCode] = useState(false);

  const fetchCodes = async () => {
    const codes = await getInviteCodes();
    setInviteCodesList(codes);
  };

  useEffect(() => {
    if (activeTab === 'passcodes') {
      fetchCodes();
    }
  }, [activeTab]);

  const handleGenerateCode = async (e) => {
    e.preventDefault();
    setGeneratingCode(true);
    try {
      const created = await createInviteCode({
        role: 'teacher',
        hoursValid: selectedHours,
        assignedClasses: [selectedClass],
        createdBy: userProfile?.email || 'admin'
      });
      setNewCodeSuccess(created);
      await fetchCodes();
    } catch (err) {
      console.error('Failed to create invite code:', err);
    } finally {
      setGeneratingCode(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    ...(!isTeacher ? [{ id: 'passcodes', label: 'Teacher Passcodes', icon: 'key' }] : []),
    { id: 'school', label: 'School Info', icon: 'school' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'security', label: 'Security', icon: 'security' },
    { id: 'system', label: 'System & Theme', icon: 'tune' }
  ];

  return (
    <div class="p-xl max-w-container-max mx-auto animate-fadeIn">
      {/* Toast Notification */}
      {savedNotice && (
        <div class="fixed bottom-6 right-6 bg-secondary text-on-secondary px-lg py-md rounded-lg shadow-xl z-50 flex items-center gap-md animate-fadeIn">
          <span class="material-symbols-outlined">check_circle</span>
          <span class="font-label-md">Settings updated successfully!</span>
        </div>
      )}

      {/* Page Header */}
      <div class="flex flex-wrap justify-between items-end mb-lg gap-md">
        <div>
          <h2 class="font-display-lg text-display-lg text-primary">Portal Settings</h2>
          <p class="font-body-md text-body-md text-on-surface-variant mt-1">
            Manage profile preferences, school details, security, and access settings.
          </p>
        </div>
        <button
          onClick={handleSave}
          class="bg-secondary text-on-secondary px-lg py-sm rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-xs cursor-pointer"
        >
          <span class="material-symbols-outlined text-[20px]">save</span>
          Save Changes
        </button>
      </div>

      {/* Tabs Row */}
      <div class="flex border-b border-outline-variant mb-lg overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              class={`flex items-center gap-xs px-lg py-md font-label-md border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span class="material-symbols-outlined text-[20px]">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div class="bg-surface-container-lowest p-xl rounded-xl shadow-sm border border-outline-variant max-w-4xl">

        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} class="space-y-lg animate-fadeIn">
            <h3 class="font-headline-sm text-primary border-b border-outline-variant/30 pb-sm">
              {isTeacher ? 'Teacher Profile Settings' : 'Principal Profile Settings'}
            </h3>
            <div class="flex items-center gap-lg">
              <div class="relative">
                <img
                  src={profileData.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80'}
                  alt="Avatar"
                  class="w-20 h-20 rounded-full object-cover border-2 border-primary-fixed"
                />
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  class="absolute bottom-0 right-0 bg-primary text-on-primary p-1 rounded-full text-xs shadow-md hover:scale-105 transition-transform cursor-pointer"
                >
                  <span class="material-symbols-outlined text-[16px]">photo_camera</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  class="hidden"
                />
              </div>
              <div>
                <h4 class="font-headline-sm text-on-surface">{profileData.name}</h4>
                <p class="text-body-md text-on-surface-variant">{profileData.title}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label class="block text-label-sm text-on-surface-variant uppercase font-bold mb-xs">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.name || ''}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label class="block text-label-sm text-on-surface-variant uppercase font-bold mb-xs">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email || ''}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label class="block text-label-sm text-on-surface-variant uppercase font-bold mb-xs">
                  {isTeacher ? 'Role / Title' : 'Administrative Title'}
                </label>
                <input
                  type="text"
                  value={profileData.title || ''}
                  onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                  class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label class="block text-label-sm text-on-surface-variant uppercase font-bold mb-xs">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={profileData.phone || ''}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label class="block text-label-sm text-on-surface-variant uppercase font-bold mb-xs">
                {isTeacher ? 'Teacher Bio' : 'Administrative Bio'}
              </label>
              <textarea
                rows="3"
                value={profileData.bio || ''}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                class="w-full bg-surface-container-low border border-outline-variant rounded-lg p-md text-body-md focus:ring-2 focus:ring-primary outline-none"
              ></textarea>
            </div>
          </form>
        )}

        {/* Teacher Passcodes Tab */}
        {activeTab === 'passcodes' && (
          <div class="space-y-lg animate-fadeIn">
            <div class="border-b border-outline-variant/30 pb-sm">
              <h3 class="font-headline-sm text-primary">Teacher Passcode Management</h3>
              <p class="text-body-md text-on-surface-variant mt-1">
                Generate single-use invitation passcodes for teachers. Passcodes expire automatically after 24–72 hours.
              </p>
            </div>

            {/* Passcode Generator Form */}
            <form onSubmit={handleGenerateCode} class="bg-surface-container-low p-md rounded-xl border border-outline-variant/60 space-y-md">
              <h4 class="font-label-md font-bold uppercase tracking-wider text-primary flex items-center gap-xs">
                <span class="material-symbols-outlined text-[20px]">add_moderator</span>
                Generate New Invitation Passcode
              </h4>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label class="block text-label-sm text-on-surface-variant uppercase font-bold mb-xs">
                    Expiration Window
                  </label>
                  <select
                    value={selectedHours}
                    onChange={(e) => setSelectedHours(Number(e.target.value))}
                    class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-md outline-none text-on-surface cursor-pointer"
                  >
                    <option value={24}>24 Hours (1 Day)</option>
                    <option value={48}>48 Hours (2 Days)</option>
                    <option value={72}>72 Hours (3 Days)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-label-sm text-on-surface-variant uppercase font-bold mb-xs">
                    Assigned Primary Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-md outline-none text-on-surface cursor-pointer"
                  >
                    <option value="Class 10A">Class 10A</option>
                    <option value="Class 10B">Class 10B</option>
                    <option value="Class 11A">Class 11A</option>
                    <option value="Class 11B">Class 11B</option>
                    <option value="Class 12A">Class 12A</option>
                  </select>
                </div>
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  disabled={generatingCode}
                  class="bg-primary text-white px-lg py-sm rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-xs cursor-pointer disabled:opacity-50"
                >
                  <span class="material-symbols-outlined text-[18px]">key</span>
                  {generatingCode ? 'Generating...' : 'Generate Teacher Passcode'}
                </button>
              </div>
            </form>

            {/* Generated Code Alert */}
            {newCodeSuccess && (
              <div class="bg-secondary-container/60 border border-secondary text-on-secondary-container p-md rounded-xl flex flex-wrap items-center justify-between gap-md animate-fadeIn">
                <div>
                  <span class="text-xs uppercase font-bold tracking-wider text-secondary flex items-center gap-xs">
                    <span class="material-symbols-outlined text-[16px]">check_circle</span>
                    Passcode Created Successfully
                  </span>
                  <div class="text-2xl font-mono font-bold tracking-widest text-primary mt-1">
                    {newCodeSuccess.code}
                  </div>
                  <p class="text-xs text-on-surface-variant mt-1">
                    Valid for {selectedHours} hours. Give this passcode to the teacher to complete their sign-up.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(newCodeSuccess.code);
                    alert(`Copied passcode ${newCodeSuccess.code} to clipboard!`);
                  }}
                  class="bg-secondary text-on-secondary px-md py-xs rounded-lg font-label-md hover:opacity-90 flex items-center gap-xs cursor-pointer shadow-xs"
                >
                  <span class="material-symbols-outlined text-[16px]">content_copy</span>
                  Copy Code
                </button>
              </div>
            )}

            {/* Invite Codes Table */}
            <div>
              <h4 class="font-label-md font-bold uppercase tracking-wider text-on-surface-variant mb-xs">
                Passcode Activity & Redeemed List ({inviteCodesList.length})
              </h4>
              <div class="border border-outline-variant/60 rounded-lg overflow-hidden">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-surface-container-high border-b border-outline-variant/60 text-label-sm uppercase text-on-surface-variant">
                      <th class="py-sm px-md">Passcode</th>
                      <th class="py-sm px-md">Assigned Class</th>
                      <th class="py-sm px-md">Expires</th>
                      <th class="py-sm px-md">Status</th>
                      <th class="py-sm px-md">Redeemed By</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-outline-variant/40 text-body-md text-on-surface">
                    {inviteCodesList.length === 0 ? (
                      <tr>
                        <td colSpan="5" class="py-lg text-center text-on-surface-variant text-body-md">
                          No invitation passcodes generated yet. Create your first code above.
                        </td>
                      </tr>
                    ) : (
                      inviteCodesList.map((item) => {
                        const isExpired = item.expiresAt < Date.now();
                        return (
                          <tr key={item.id} class="hover:bg-surface-container-low transition-colors">
                            <td class="py-sm px-md font-mono font-bold text-primary">
                              {item.code}
                            </td>
                            <td class="py-sm px-md">
                              {item.assignedClasses ? item.assignedClasses.join(', ') : 'Class 10A'}
                            </td>
                            <td class="py-sm px-md text-xs text-on-surface-variant">
                              {new Date(item.expiresAt).toLocaleString()}
                            </td>
                            <td class="py-sm px-md">
                              {item.used ? (
                                <span class="bg-secondary-container/80 text-on-secondary-container text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                  Redeemed
                                </span>
                              ) : isExpired ? (
                                <span class="bg-error-container/80 text-error text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <span class="w-1.5 h-1.5 rounded-full bg-error"></span>
                                  Expired
                                </span>
                              ) : (
                                <span class="bg-primary-container/40 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                  Pending
                                </span>
                              )}
                            </td>
                            <td class="py-sm px-md text-xs text-on-surface-variant">
                              {item.usedByEmail || item.usedBy || '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* School Info Tab */}
        {activeTab === 'school' && (
          <form onSubmit={handleSave} class="space-y-lg animate-fadeIn">
            <h3 class="font-headline-sm text-primary border-b border-outline-variant/30 pb-sm">
              School & Institution Details
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label class="block text-label-sm text-on-surface-variant uppercase font-bold mb-xs">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={schoolData.schoolName || ''}
                  onChange={(e) => setSchoolData({ ...schoolData, schoolName: e.target.value })}
                  class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label class="block text-label-sm text-on-surface-variant uppercase font-bold mb-xs">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={schoolData.academicYear || ''}
                  onChange={(e) => setSchoolData({ ...schoolData, academicYear: e.target.value })}
                  class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-label-sm text-on-surface-variant uppercase font-bold mb-xs">
                  School Address
                </label>
                <input
                  type="text"
                  value={schoolData.address || ''}
                  onChange={(e) => setSchoolData({ ...schoolData, address: e.target.value })}
                  class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label class="block text-label-sm text-on-surface-variant uppercase font-bold mb-xs">
                  Emergency Broadcast Hotline
                </label>
                <input
                  type="text"
                  value={schoolData.emergencyPhone || ''}
                  onChange={(e) => setSchoolData({ ...schoolData, emergencyPhone: e.target.value })}
                  class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label class="block text-label-sm text-on-surface-variant uppercase font-bold mb-xs">
                  Official Administrative Email
                </label>
                <input
                  type="email"
                  value={schoolData.contactEmail || ''}
                  onChange={(e) => setSchoolData({ ...schoolData, contactEmail: e.target.value })}
                  class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
          </form>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div class="space-y-lg animate-fadeIn">
            <h3 class="font-headline-sm text-primary border-b border-outline-variant/30 pb-sm">
              Notification Preferences
            </h3>
            <div class="space-y-md">
              <div class="flex items-center justify-between p-md bg-surface-container-low rounded-lg border border-outline-variant/40">
                <div>
                  <p class="font-bold text-on-surface text-body-md">Daily Attendance Summary Digest</p>
                  <p class="text-xs text-on-surface-variant">Receive an automated email every evening with class presence percentages.</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!notifications.attendanceDigest}
                  onChange={(e) => handleNotificationToggle('attendanceDigest', e.target.checked)}
                  class="w-5 h-5 accent-primary cursor-pointer"
                />
              </div>
              <div class="flex items-center justify-between p-md bg-surface-container-low rounded-lg border border-outline-variant/40">
                <div>
                  <p class="font-bold text-on-surface text-body-md">Overdue Fee Escalation Alerts</p>
                  <p class="text-xs text-on-surface-variant">Get notified when tuition payments pass 14 days overdue.</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!notifications.feeAlerts}
                  onChange={(e) => handleNotificationToggle('feeAlerts', e.target.checked)}
                  class="w-5 h-5 accent-primary cursor-pointer"
                />
              </div>
              <div class="flex items-center justify-between p-md bg-surface-container-low rounded-lg border border-outline-variant/40">
                <div>
                  <p class="font-bold text-on-surface text-body-md">Emergency SMS Broadcast Notifications</p>
                  <p class="text-xs text-on-surface-variant">Instant SMS dispatch when emergency drills or alerts are triggered.</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!notifications.emergencySms}
                  onChange={(e) => handleNotificationToggle('emergencySms', e.target.checked)}
                  class="w-5 h-5 accent-primary cursor-pointer"
                />
              </div>
              <div class="flex items-center justify-between p-md bg-surface-container-low rounded-lg border border-outline-variant/40">
                <div>
                  <p class="font-bold text-on-surface text-body-md">New Registration Confirmations</p>
                  <p class="text-xs text-on-surface-variant">Auto-send a welcome SMS + email to guardians when a student is registered.</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!notifications.registrationAlerts}
                  onChange={(e) => handleNotificationToggle('registrationAlerts', e.target.checked)}
                  class="w-5 h-5 accent-primary cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div class="space-y-lg animate-fadeIn">
            <h3 class="font-headline-sm text-primary border-b border-outline-variant/30 pb-sm">
              Security & Access Control
            </h3>
            <div class="space-y-md">
              <div class="flex items-center justify-between p-md bg-surface-container-low rounded-lg border border-outline-variant/40">
                <div>
                  <p class="font-bold text-on-surface text-body-md">Two-Factor Authentication (2FA)</p>
                  <p class="text-xs text-on-surface-variant">Require SMS or Authenticator code upon signing into Principal Portal.</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!security.twoFactor}
                  onChange={(e) => handleSecurityChange('twoFactor', e.target.checked)}
                  class="w-5 h-5 accent-primary cursor-pointer"
                />
              </div>
              <div class="p-md bg-surface-container-low rounded-lg border border-outline-variant/40">
                <label class="block text-label-sm text-on-surface-variant uppercase font-bold mb-xs">
                  Session Idle Timeout
                </label>
                <select
                  value={security.sessionTimeout || '30m'}
                  onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                  class="bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-md outline-none text-on-surface cursor-pointer"
                >
                  <option value="15m">15 Minutes</option>
                  <option value="30m">30 Minutes</option>
                  <option value="1h">1 Hour</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* System & Theme Tab */}
        {activeTab === 'system' && (
          <div class="space-y-lg animate-fadeIn">
            <h3 class="font-headline-sm text-primary border-b border-outline-variant/30 pb-sm">
              System & Theme Configuration
            </h3>
            <div class="space-y-md">
              <div class="flex items-center justify-between p-md bg-surface-container-low rounded-lg border border-outline-variant/40">
                <div>
                  <p class="font-bold text-on-surface text-body-md">Compact Table View</p>
                  <p class="text-xs text-on-surface-variant">Reduce padding in Student and Fee management tables for high density displays.</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!theme.compactTable}
                  onChange={(e) => handleThemeToggle('compactTable', e.target.checked)}
                  class="w-5 h-5 accent-primary cursor-pointer"
                />
              </div>
              <div class="p-md bg-surface-container-low rounded-lg border border-outline-variant/40 flex justify-between items-center">
                <div>
                  <p class="font-bold text-on-surface text-body-md">Export Portal Database Backup</p>
                  <p class="text-xs text-on-surface-variant">Generate a full encrypted JSON backup of all student, fee, and attendance records.</p>
                </div>
                <button
                  type="button"
                  onClick={exportDatabaseBackup}
                  class="px-md py-sm border border-primary text-primary rounded-lg font-label-md hover:bg-primary-fixed transition-colors flex items-center gap-xs cursor-pointer"
                >
                  <span class="material-symbols-outlined text-[18px]">download</span>
                  Export Backup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
