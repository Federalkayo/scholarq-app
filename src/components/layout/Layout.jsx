import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ScholarBot from '../ui/ScholarBot';
import NotificationToastContainer from '../ui/NotificationToast';

export default function Layout() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [selectedSection, setSelectedSection] = useState('Section A');

  return (
    <div class="min-h-screen bg-background text-on-surface flex relative">
      <Sidebar />
      <div class="flex-1 flex flex-col min-w-0">
        <Topbar
          searchFilter={searchQuery}
          onSearchChange={setSearchQuery}
          selectedClass={selectedClass}
          onClassChange={setSelectedClass}
          selectedSection={selectedSection}
          onSectionChange={setSelectedSection}
        />
        <main class="ml-sidebar-width pt-16 h-screen overflow-y-auto bg-surface scrollbar-hide">
          <div key={location.pathname} class="animate-fadeIn">
            <Outlet
              context={{
                searchQuery,
                setSearchQuery,
                selectedClass,
                setSelectedClass,
                selectedSection,
                setSelectedSection
              }}
            />
          </div>
        </main>
      </div>
      <ScholarBot />
      <NotificationToastContainer />
    </div>
  );
}
