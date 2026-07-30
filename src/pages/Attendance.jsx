import React, { useState } from 'react';
import AttendanceToggle from '../components/ui/AttendanceToggle';
import Avatar from '../components/ui/Avatar';
import { mockRollCallStudents } from '../data/mockData';

export default function Attendance() {
  const [students, setStudents] = useState(mockRollCallStudents);

  const handleStatusChange = (rollNo, newStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.rollNo === rollNo ? { ...s, status: newStatus } : s))
    );
  };

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'Present' })));
  };

  const presentCount = students.filter((s) => s.status === 'Present').length;
  const absentCount = students.filter((s) => s.status === 'Absent').length;
  const lateCount = students.filter((s) => s.status === 'Late').length;
  const total = students.length;
  const attendanceRate = total > 0 ? ((presentCount / total) * 100).toFixed(1) : '0.0';

  return (
    <div class="p-xl max-w-container-max mx-auto">
      {/* Summary Header Card */}
      <div class="bg-surface-container-lowest rounded-xl shadow-sm p-lg mb-lg flex flex-wrap items-center justify-between gap-lg border border-outline-variant">
        <div class="flex items-center gap-lg">
          <div>
            <p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-base font-bold">
              Daily Attendance
            </p>
            <div class="flex items-baseline gap-xs">
              <span class="text-display-lg font-display-lg text-primary">{attendanceRate}%</span>
              <span class="text-label-md text-secondary font-bold flex items-center">
                <span class="material-symbols-outlined text-[16px]">trending_up</span> +1.5%
              </span>
            </div>
          </div>
          <div class="h-12 w-px bg-outline-variant"></div>
          <div class="flex gap-lg text-center">
            <div>
              <p class="text-label-sm text-on-surface-variant">Present</p>
              <p class="font-bold text-headline-sm text-on-surface">{presentCount}</p>
            </div>
            <div>
              <p class="text-label-sm text-on-surface-variant">Absent</p>
              <p class="font-bold text-headline-sm text-error">{absentCount}</p>
            </div>
            <div>
              <p class="text-label-sm text-on-surface-variant">Late</p>
              <p class="font-bold text-headline-sm text-tertiary-container">{lateCount}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-md">
          <button class="flex items-center gap-xs border border-outline-variant px-md py-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface font-label-md">
            <span class="material-symbols-outlined text-[18px]">file_download</span>
            <span class="text-label-md">Export Daily Report</span>
          </button>
          <button
            onClick={markAllPresent}
            class="bg-secondary text-on-secondary px-lg py-2 rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all"
          >
            Mark All Present
          </button>
        </div>
      </div>

      <div class="flex flex-col lg:flex-row gap-lg">
        {/* Student Roll Call List */}
        <div class="flex-1">
          <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
            <div class="px-lg py-md border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
              <h2 class="font-headline-sm text-on-surface">Student Roll Call</h2>
              <span class="text-label-sm text-on-surface-variant">Tuesday, Oct 24, 2023</span>
            </div>
            <div class="divide-y divide-outline-variant">
              {students.map((st) => (
                <div
                  key={st.rollNo}
                  class="px-lg py-md hover:bg-surface-container-low transition-colors flex items-center justify-between group"
                >
                  <div class="flex items-center gap-md">
                    <span class="text-label-sm text-outline w-6 font-bold">{st.rollNo}</span>
                    <Avatar initials={st.initials} size="w-10 h-10" />
                    <div>
                      <p class="font-body-md text-body-md text-on-surface font-semibold">{st.name}</p>
                      <p class="text-xs text-on-surface-variant">{st.id}</p>
                    </div>
                  </div>
                  <AttendanceToggle
                    value={st.status}
                    onChange={(val) => handleStatusChange(st.rollNo, val)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Cards: Historical Lookback & Audit Log */}
        <div class="w-full lg:w-80 space-y-lg">
          <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-lg">
            <h3 class="font-headline-sm text-primary mb-md">Historical Lookback</h3>
            <p class="text-body-md text-on-surface-variant mb-lg">
              Weekly average for Class 10-A is <strong class="text-secondary">95.4%</strong>.
            </p>
            <div class="space-y-sm text-body-md">
              <div class="flex justify-between py-xs border-b border-outline-variant/30">
                <span class="text-on-surface-variant">Monday</span>
                <span class="font-bold text-on-surface">96.0%</span>
              </div>
              <div class="flex justify-between py-xs border-b border-outline-variant/30">
                <span class="text-on-surface-variant">Tuesday (Today)</span>
                <span class="font-bold text-secondary">{attendanceRate}%</span>
              </div>
              <div class="flex justify-between py-xs border-b border-outline-variant/30">
                <span class="text-on-surface-variant">Wednesday</span>
                <span class="text-outline">Pending</span>
              </div>
              <div class="flex justify-between py-xs border-b border-outline-variant/30">
                <span class="text-on-surface-variant">Thursday</span>
                <span class="text-outline">Pending</span>
              </div>
            </div>
          </div>

          <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-lg">
            <h3 class="font-headline-sm text-primary mb-md">Attendance Audit Log</h3>
            <div class="space-y-md text-xs text-on-surface-variant">
              <div class="border-l-2 border-primary pl-md py-xs">
                <p class="font-bold text-on-surface">Class 10-A roster loaded</p>
                <p class="text-outline">08:00 AM • Auto System</p>
              </div>
              <div class="border-l-2 border-secondary pl-md py-xs">
                <p class="font-bold text-on-surface">Sana Khan marked Late</p>
                <p class="text-outline">08:15 AM • Mrs. Abernathy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
