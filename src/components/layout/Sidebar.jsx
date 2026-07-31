import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { logout } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/students', label: 'Students', icon: 'group' },
    { path: '/attendance', label: 'Attendance', icon: 'calendar_today' },
    { path: '/fees', label: 'Fees', icon: 'payments' },
    { path: '/reports', label: 'Reports', icon: 'assessment' }
  ];

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
  };

  return (
    <aside class="fixed left-0 top-0 h-full w-sidebar-width bg-surface-container-lowest border-r border-outline-variant flex flex-col p-md z-50">
      <div class="mb-xl px-md">
        <h1 class="text-headline-sm font-headline-sm text-primary">EduAdmin Pro</h1>
        <p class="text-label-sm text-on-surface-variant">Principal Portal</p>
      </div>

      <nav class="flex-1 space-y-xs">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-sm bg-primary-container text-on-primary-container rounded-lg px-md py-sm border-l-4 border-primary group font-medium transition-all duration-200 shadow-xs'
                : 'flex items-center gap-sm text-on-surface-variant hover:bg-surface-container-high px-md py-sm rounded-lg transition-colors duration-200'
            }
          >
            {({ isActive }) => (
              <>
                <span
                  class="material-symbols-outlined"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span class="font-body-md text-body-md">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div class="mt-auto space-y-xs">
        <button class="w-full bg-primary text-on-primary py-sm px-md rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all shadow-sm mb-lg">
          New Registration
        </button>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive
              ? 'flex items-center gap-sm bg-primary-container text-on-primary-container rounded-lg px-md py-sm border-l-4 border-primary group font-medium transition-all duration-200'
              : 'flex items-center gap-sm text-on-surface-variant hover:bg-surface-container-high px-md py-sm rounded-lg transition-colors'
          }
        >
          {({ isActive }) => (
            <>
              <span
                class="material-symbols-outlined"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                settings
              </span>
              <span class="font-body-md text-body-md">Settings</span>
            </>
          )}
        </NavLink>

        <a href="#logout" onClick={handleLogout} class="flex items-center gap-sm text-error hover:bg-surface-container-high px-md py-sm rounded-lg transition-colors">
          <span class="material-symbols-outlined">logout</span>
          <span class="font-body-md text-body-md">Logout</span>
        </a>
      </div>
    </aside>
  );
}