import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ searchFilter, onSearchChange, selectedClass, onClassChange, selectedSection, onSectionChange }) {
  const location = useLocation();
  const isAttendancePage = location.pathname === '/attendance';
  const { currentUser, userProfile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = userProfile?.email || currentUser?.email || 'Account';
  const displayRole = userProfile?.role
    ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)
    : '';
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
                value={selectedClass || 'Class 10'}
                onChange={(e) => onClassChange && onClassChange(e.target.value)}
                class="appearance-none bg-surface-container-low border border-outline-variant rounded-lg pl-md pr-xl py-xs text-label-md focus:ring-2 focus:ring-primary outline-none cursor-pointer text-on-surface"
              >
                <option>Class 10</option>
                <option>Class 11</option>
                <option>Class 12</option>
              </select>
              <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant scale-75">
                expand_more
              </span>
            </div>
            <div class="relative">
              <select
                value={selectedSection || 'Section A'}
                onChange={(e) => onSectionChange && onSectionChange(e.target.value)}
                class="appearance-none bg-surface-container-low border border-outline-variant rounded-lg pl-md pr-xl py-xs text-label-md focus:ring-2 focus:ring-primary outline-none cursor-pointer text-on-surface"
              >
                <option>Section A</option>
                <option>Section B</option>
                <option>Section C</option>
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
          <button class="p-2 hover:bg-surface-container-high rounded-full transition-colors relative">
            <span class="material-symbols-outlined text-on-surface-variant">notifications</span>
            <span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
          </button>
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
            <div class="w-10 h-10 rounded-full border-2 border-primary-fixed-dim bg-primary-fixed flex items-center justify-center font-bold text-primary">
              {initial}
            </div>
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