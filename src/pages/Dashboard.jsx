import React, { useEffect, useState } from 'react';
import StatCard from '../components/ui/StatCard';
import ActivityItem from '../components/ui/ActivityItem';
import { dashboardKPIs, weeklyAttendanceTrend, recentActivities, academicCalendarEvents } from '../data/mockData';

export default function Dashboard() {
  const [animateBars, setAnimateBars] = useState(false);
  const [animateRing, setAnimateRing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateBars(true);
      setAnimateRing(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div class="p-xl max-w-container-max mx-auto">
      {/* Page Header */}
      <div class="mb-xl flex flex-wrap justify-between items-end gap-md">
        <div>
          <h2 class="font-display-lg text-display-lg text-primary">Academic Overview</h2>
          <p class="font-body-md text-body-md text-on-surface-variant mt-1">
            Status report for Academic Year 2023-24 • <span class="text-secondary font-bold">Live Updates</span>
          </p>
        </div>
        <div class="flex gap-md">
          <button class="bg-surface-container-lowest border border-outline-variant px-md py-2 rounded-lg flex items-center gap-xs font-label-md hover:bg-surface-container-high transition-colors text-on-surface">
            <span class="material-symbols-outlined text-[20px]">calendar_month</span>
            This Semester
          </button>
          <button class="bg-surface-container-lowest border border-outline-variant px-md py-2 rounded-lg flex items-center gap-xs font-label-md hover:bg-surface-container-high transition-colors text-on-surface">
            <span class="material-symbols-outlined text-[20px]">download</span>
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Row: Bento Style */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-lg">
        {dashboardKPIs.map((kpi) => (
          <StatCard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            trend={kpi.trend}
            trendType={kpi.trendType}
            icon={kpi.icon}
            iconBg={kpi.iconBg}
            iconColor={kpi.iconColor}
          />
        ))}
      </div>

      {/* Dashboard Grid */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Attendance Chart */}
        <div class="lg:col-span-2 bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant hover-lift">
          <div class="flex justify-between items-center mb-xl">
            <h3 class="font-headline-sm text-headline-sm text-primary">Weekly Attendance Trend</h3>
            <div class="flex gap-md items-center">
              <div class="flex items-center gap-xs">
                <span class="w-3 h-3 bg-primary rounded-full"></span>
                <span class="text-label-sm text-on-surface-variant font-medium">Present</span>
              </div>
              <div class="flex items-center gap-xs">
                <span class="w-3 h-3 bg-surface-container-highest rounded-full border border-outline-variant"></span>
                <span class="text-label-sm text-on-surface-variant font-medium">Absent</span>
              </div>
            </div>
          </div>
          <div class="flex items-end justify-between h-64 gap-lg px-4 border-b border-outline-variant">
            {weeklyAttendanceTrend.map((item) => (
              <div
                key={item.day}
                class={`flex-1 flex flex-col items-center group relative ${!item.active ? 'opacity-50' : ''}`}
              >
                {/* Hover Tooltip */}
                <div class="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-on-primary text-xs px-2 py-1 rounded shadow-md z-20 pointer-events-none">
                  {item.height}
                </div>
                <div class="w-12 bg-primary/10 rounded-t-lg h-full absolute bottom-0"></div>
                <div
                  class="w-12 bg-primary rounded-t-lg chart-bar z-10 transition-all duration-1000 ease-out"
                  style={{ height: animateBars ? item.height : '0%' }}
                ></div>
                <span class="mt-4 text-label-sm font-bold text-on-surface-variant">{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fee Progress */}
        <div class="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant flex flex-col hover-lift">
          <h3 class="font-headline-sm text-headline-sm text-primary mb-xl">Fee Collection</h3>
          <div class="flex-1 flex flex-col items-center justify-center relative min-h-[192px]">
            {/* Animated Circular SVG Progress */}
            <svg class="w-48 h-48 -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="80"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="16"
                class="text-surface-container-high"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="16"
                strokeDasharray="502.6"
                strokeDashoffset={animateRing ? '60' : '502.6'}
                strokeLinecap="round"
                class="text-secondary transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1)"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="font-display-lg text-display-lg text-on-surface">88%</span>
              <span class="text-label-sm text-on-surface-variant font-medium">Collected</span>
            </div>
          </div>
          <div class="mt-xl space-y-md">
            <div class="flex justify-between items-center text-body-md">
              <span class="flex items-center gap-xs">
                <span class="w-2 h-2 rounded-full bg-secondary"></span> Received
              </span>
              <span class="font-bold text-on-surface">$1.2M</span>
            </div>
            <div class="flex justify-between items-center text-body-md">
              <span class="flex items-center gap-xs">
                <span class="w-2 h-2 rounded-full bg-surface-container-high"></span> Outstanding
              </span>
              <span class="font-bold text-on-surface-variant">$164k</span>
            </div>
            <button class="w-full mt-4 py-2 border border-primary text-primary rounded-lg font-label-md hover:bg-primary-fixed transition-colors">
              View Details
            </button>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div class="lg:col-span-1 bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant hover-lift">
          <div class="flex justify-between items-center mb-xl">
            <h3 class="font-headline-sm text-headline-sm text-primary">Recent Activity</h3>
            <span class="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
              more_horiz
            </span>
          </div>
          <div class="space-y-lg">
            {recentActivities.map((act) => (
              <ActivityItem
                key={act.id}
                title={act.title}
                subtitle={act.subtitle}
                timestamp={act.timestamp}
                icon={act.icon}
                bg={act.bg}
                color={act.color}
              />
            ))}
          </div>
          <button class="w-full mt-xl text-center font-label-md text-primary hover:underline transition-all">
            View All Activity
          </button>
        </div>

        {/* Academic Calendar */}
        <div class="lg:col-span-2 bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant hover-lift">
          <div class="flex justify-between items-center mb-xl">
            <h3 class="font-headline-sm text-headline-sm text-primary">Academic Calendar</h3>
            <div class="flex border border-outline-variant rounded-lg overflow-hidden">
              <button class="px-4 py-2 bg-primary text-on-primary text-label-sm font-medium">Month</button>
              <button class="px-4 py-2 hover:bg-surface-container-high text-label-sm text-on-surface-variant font-medium">
                Week
              </button>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
            {academicCalendarEvents.map((evt) => (
              <div key={evt.id} class={`p-md border-l-4 ${evt.border} ${evt.bg} rounded-r-lg hover:scale-[1.01] transition-transform`}>
                <div class="flex justify-between items-start">
                  <div>
                    <p class={`font-bold text-body-md ${evt.textColor}`}>{evt.title}</p>
                    <p class="text-body-md text-on-surface-variant">{evt.dateTime}</p>
                  </div>
                  <span class={`material-symbols-outlined ${evt.textColor}`}>{evt.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
