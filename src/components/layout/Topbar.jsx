import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useNotifications, iconForType, accentForType } from '../../context/NotificationContext';
import { enablePushNotifications, currentPermission } from '../../lib/messaging';

function timeAgo(timestamp) {
  const ms = timestamp?.toMillis ? timestamp.toMillis() : timestamp?.seconds ? timestamp.seconds * 1000 : null;
  if (!ms) return '';
  const diff = Date.now() - ms;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function Topbar({ searchFilter, onSearchChange, selectedClass, onClassChange, selectedSection, onSectionChange }) {
  const location = useLocation();
  const isAttendancePage = location.pathname === '/attendance';
  const { currentUser, userProfile, logout } = useAuth();
  const { settings } = useSettings();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const navigate = useNavigate();

  useEffect(() => {
    setPushPermission(currentPermission());
  }, []);

  const handleEnablePush = async () => {
    const token = await enablePushNotifications();
    setPushPermission(currentPermission());
    if (!token && currentPermission() === 'denied') {
      // Browser-level denial can only be reversed from browser site settings.
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) markAsRead(notification.id);
    setNotifOpen(false);
    if (notification.data?.route) navigate(notification.data.route);
  };

  const profile = settings?.profileData;
  const isTeacher = userProfile?.role === 'teacher';

  const displayName = userProfile?.name || (isTeacher ? 'Teacher' : profile?.name) || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const displayRole = isTeacher
    ? (userProfile?.title || `Teacher (${(userProfile?.assignedClasses || ['Class 10A']).join(', ')})`)
    : (userProfile?.title || profile?.title || 'Principal & Chief Administrator');
  const avatarUrl = userProfile?.avatar || (!isTeacher ? profile?.avatar : null);
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header class="fixed top-0 right-0 w-[calc(100%-260px)] h-16 bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center px-xl z-40">
      <div class="flex items-center gap-lg w-1/2">
        {isAttendancePage ? (
          <div class="flex items-center gap-md">
            <div class="relative">
              <select
                value={selectedClass || 'All Classes'}
                onChange={(e) => onClassChange && onClassChange(e.target.value)}
                class="appearance-none bg-surface-container-low border border-outline-variant rounded-lg pl-md pr-xl py-xs text-label-md focus:ring-2 focus:ring-primary outline-none cursor-pointer text-on-surface"
              >
                <option>All Classes</option>
                <option>Grade 3</option>
                <option>Grade 4</option>
                <option>Grade 5</option>
                <option>Grade 6</option>
                <option>Grade 7</option>
                <option>Grade 8</option>
                <option>Grade 9</option>
                <option>Grade 10</option>
                <option>Grade 11</option>
                <option>Grade 12</option>
              </select>
              <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant scale-75">
                expand_more
              </span>
            </div>
            <div class="relative">
              <select
                value={selectedSection || 'All Sections'}
                onChange={(e) => onSectionChange && onSectionChange(e.target.value)}
                class="appearance-none bg-surface-container-low border border-outline-variant rounded-lg pl-md pr-xl py-xs text-label-md focus:ring-2 focus:ring-primary outline-none cursor-pointer text-on-surface"
              >
                <option>All Sections</option>
                <option>Section A</option>
                <option>Section B</option>
                <option>Section C</option>
                <option>Section D</option>
              </select>
              <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant scale-75">
                expand_more
              </span>
            </div>
          </div>
        ) : (
          <div class="relative w-full max-w-md">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              value={searchFilter || ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Search students, records, or staff..."
              class="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg pl-10 pr-4 py-2 text-label-md focus:ring-2 focus:ring-primary/20 outline-none text-on-surface"
            />
          </div>
        )}
      </div>

      <div class="flex items-center gap-lg">
        <div class="flex items-center gap-md">
          <div class="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              class="p-2 hover:bg-surface-container-high rounded-full transition-colors relative"
            >
              <span class="material-symbols-outlined text-on-surface-variant">notifications</span>
              {unreadCount > 0 && (
                <span class="absolute top-1 right-1 min-w-[16px] h-[16px] px-[3px] bg-error text-on-error text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div class="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl z-50 animate-fadeIn">
                <div class="flex items-center justify-between px-md py-sm border-b border-outline-variant/50 sticky top-0 bg-surface-container-lowest">
                  <p class="font-label-md font-bold text-on-surface">Notifications</p>
                  {pushPermission !== 'granted' && pushPermission !== 'unsupported' && (
                    <button
                      onClick={handleEnablePush}
                      class="text-[11px] font-label-sm text-primary hover:underline"
                    >
                      {pushPermission === 'denied' ? 'Push blocked' : 'Enable push'}
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p class="text-body-md text-on-surface-variant text-center py-xl px-md">
                    No notifications yet.
                  </p>
                ) : (
                  <ul>
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        class={`flex items-start gap-sm px-md py-sm border-b border-outline-variant/30 last:border-0 cursor-pointer hover:bg-surface-container-high transition-colors ${
                          !n.read ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div class={`shrink-0 w-7 h-7 rounded-full ${accentForType(n.type)} flex items-center justify-center mt-0.5`}>
                          <span class="material-symbols-outlined text-white text-[15px]">{iconForType(n.type)}</span>
                        </div>
                        <div class="min-w-0 flex-1">
                          <p class="font-label-md text-on-surface font-bold leading-snug truncate">{n.title}</p>
                          <p class="text-xs text-on-surface-variant leading-snug mt-0.5 line-clamp-2">{n.body}</p>
                          <p class="text-[10px] text-on-surface-variant/70 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && <span class="shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <button class="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <span class="material-symbols-outlined text-on-surface-variant">help</span>
          </button>
        </div>
        <div class="h-8 w-px bg-outline-variant"></div>

        <div class="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            class="flex items-center gap-sm cursor-pointer group"
          >
            <div class="text-right hidden sm:block">
              <p class="font-label-md text-on-surface font-bold leading-none truncate max-w-[160px]">
                {displayName}
              </p>
              {displayRole && (
                <p class="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">
                  {displayRole}
                </p>
              )}
            </div>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                class="w-10 h-10 rounded-full object-cover border-2 border-primary-fixed-dim"
              />
            ) : (
              <div class="w-10 h-10 rounded-full border-2 border-primary-fixed-dim bg-primary-fixed flex items-center justify-center font-bold text-primary">
                {initial}
              </div>
            )}
          </button>

          {menuOpen && (
            <div class="absolute right-0 mt-2 w-44 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-1 z-50">
              <button
                onClick={handleLogout}
                class="w-full text-left px-md py-2 text-label-md text-error hover:bg-error-container/40 flex items-center gap-xs"
              >
                <span class="material-symbols-outlined text-[18px]">logout</span>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}