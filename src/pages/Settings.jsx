import React, { useState } from 'react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [savedNotice, setSavedNotice] = useState(false);

  // Form State
  const [profileData, setProfileData] = useState({
    name: 'Dr. Sarah Jenkins',
    email: 's.jenkins@eduadmin.edu',
    title: 'Principal & Chief Administrator',
    phone: '+1 (555) 019-2834',
    bio: 'Overseeing academic excellence and administrative operations for Academic Year 2023-24.'
  });

  const [schoolData, setSchoolData] = useState({
    schoolName: 'EduAdmin Academy & High School',
    academicYear: '2023-2024',
    address: '742 Evergreen Terrace, Springfield',
    emergencyPhone: '+1 (555) 911-0000',
    contactEmail: 'admin@eduadmin.edu'
  });

  const [notifications, setNotifications] = useState({
    attendanceDigest: true,
    feeAlerts: true,
    emergencySms: true,
    weeklyReportEmail: false
  });

  const [security, setSecurity] = useState({
    twoFactor: true,
    sessionTimeout: '30m'
  });

  const [theme, setTheme] = useState({
    darkMode: false,
    compactTable: false
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'person' },
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
            Manage administrative preferences, school details, security, and system configuration.
          </p>
        </div>
        <button
          onClick={handleSave}
          class="bg-secondary text-on-secondary px-lg py-sm rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-xs"
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
              class={`flex items-center gap-xs px-lg py-md font-label-md transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-primary text-primary font-bold bg-primary/5'
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
              Principal Profile Settings
            </h3>
            <div class="flex items-center gap-lg">
              <div class="relative">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
                  alt="Avatar"
                  class="w-20 h-20 rounded-full object-cover border-2 border-primary-fixed"
                />
                <button
                  type="button"
                  class="absolute bottom-0 right-0 bg-primary text-on-primary p-1 rounded-full text-xs shadow-md hover:scale-105 transition-transform"
                >
                  <span class="material-symbols-outlined text-[16px]">photo_camera</span>
                </button>
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
                  value={profileData.name}
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
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label class="block text-label-sm text-on-surface-variant uppercase font-bold mb-xs">
                  Administrative Title
                </label>
                <input
                  type="text"
                  value={profileData.title}
                  onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                  class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label class="block text-label-sm text-on-surface-variant uppercase font-bold mb-xs">
                  Office Phone
                </label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  class="w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label class="block text-label-sm text-on-surface-variant uppercase font-bold mb-xs">
                Administrative Bio
              </label>
              <textarea
                rows="3"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                class="w-full bg-surface-container-low border border-outline-variant rounded-lg p-md text-body-md focus:ring-2 focus:ring-primary outline-none"
              ></textarea>
            </div>
          </form>
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
                  value={schoolData.schoolName}
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
                  value={schoolData.academicYear}
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
                  value={schoolData.address}
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
                  value={schoolData.emergencyPhone}
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
                  value={schoolData.contactEmail}
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
                  checked={notifications.attendanceDigest}
                  onChange={(e) => setNotifications({ ...notifications, attendanceDigest: e.target.checked })}
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
                  checked={notifications.feeAlerts}
                  onChange={(e) => setNotifications({ ...notifications, feeAlerts: e.target.checked })}
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
                  checked={notifications.emergencySms}
                  onChange={(e) => setNotifications({ ...notifications, emergencySms: e.target.checked })}
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
                  checked={security.twoFactor}
                  onChange={(e) => setSecurity({ ...security, twoFactor: e.target.checked })}
                  class="w-5 h-5 accent-primary cursor-pointer"
                />
              </div>
              <div class="p-md bg-surface-container-low rounded-lg border border-outline-variant/40">
                <label class="block text-label-sm text-on-surface-variant uppercase font-bold mb-xs">
                  Session Idle Timeout
                </label>
                <select
                  value={security.sessionTimeout}
                  onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                  class="bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-md outline-none text-on-surface"
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
                  checked={theme.compactTable}
                  onChange={(e) => setTheme({ ...theme, compactTable: e.target.checked })}
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
                  class="px-md py-sm border border-primary text-primary rounded-lg font-label-md hover:bg-primary-fixed transition-colors flex items-center gap-xs"
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
