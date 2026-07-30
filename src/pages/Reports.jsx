import React, { useEffect, useState } from 'react';
import { mockSectionPerformance } from '../data/mockData';

export default function Reports() {
  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateBars(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const weeklyTrend = [
    { day: 'Mon', pct: '92%' },
    { day: 'Tue', pct: '95%' },
    { day: 'Wed', pct: '94%' },
    { day: 'Thu', pct: '96%' },
    { day: 'Fri', pct: '93%' }
  ];

  const feeTrend = [
    { month: 'Aug', expected: '75%', collected: '65%', label: '$80k' },
    { month: 'Sep', expected: '85%', collected: '78%', label: '$95k' },
    { month: 'Oct', expected: '95%', collected: '88%', label: '$124k' },
    { month: 'Nov (Est)', expected: '100%', collected: '70%', label: '$140k (Est)' }
  ];

  return (
    <div class="p-xl max-w-container-max mx-auto animate-fadeIn">
      {/* Page Header */}
      <div class="mb-xl flex flex-wrap justify-between items-end gap-md">
        <div>
          <h2 class="font-display-lg text-display-lg text-primary">Reports & Analytics</h2>
          <p class="font-body-lg text-body-lg text-on-surface-variant">
            Real-time institutional performance insights for the current term.
          </p>
        </div>
        <div class="flex gap-md">
          <button class="flex items-center gap-xs px-md py-sm border border-outline text-on-surface-variant rounded-lg font-label-md hover:bg-surface-container-high transition-all">
            <span class="material-symbols-outlined text-[20px]">calendar_month</span>
            Last 7 Days
            <span class="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
          <button class="flex items-center gap-xs px-md py-sm bg-primary text-on-primary rounded-lg font-label-md hover:opacity-90 transition-all shadow-sm">
            <span class="material-symbols-outlined text-[20px]">download</span>
            Export PDF
          </button>
        </div>
      </div>

      {/* Dashboard Layout (Bento Style) */}
      <div class="grid grid-cols-12 gap-lg">
        {/* AI Summary Card (Spans 4 columns) */}
        <div class="col-span-12 lg:col-span-4 flex flex-col gap-lg">
          <div class="bg-primary text-on-primary rounded-xl p-lg shadow-sm relative overflow-hidden h-full flex flex-col justify-between hover-lift">
            <div class="absolute -right-8 -top-8 opacity-10 pointer-events-none">
              <span class="material-symbols-outlined text-[160px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
            </div>
            <div class="relative z-10">
              <div class="flex items-center gap-xs mb-md">
                <span class="material-symbols-outlined text-secondary-fixed animate-pulse">auto_awesome</span>
                <h3 class="font-label-sm text-label-sm uppercase tracking-widest text-on-primary-container font-bold">
                  Weekly Summary
                </h3>
              </div>
              <h4 class="font-headline-md text-headline-md mb-sm text-white">AI Insights</h4>
              <div class="space-y-md text-on-primary-container">
                <div class="flex gap-md items-start bg-white/5 p-md rounded-lg">
                  <span class="material-symbols-outlined text-secondary-fixed mt-1">trending_up</span>
                  <p class="font-body-md text-body-md text-on-primary-container">
                    <strong class="text-white">Attendance</strong> is up 2% from last week, reaching a seasonal high of 96.4%.
                  </p>
                </div>
                <div class="flex gap-md items-start bg-white/5 p-md rounded-lg">
                  <span class="material-symbols-outlined text-tertiary-fixed-dim mt-1">warning</span>
                  <p class="font-body-md text-body-md text-on-primary-container">
                    <strong class="text-white">Fees collection</strong> is lagging in Grade 8 (12% behind target). Follow-up reminders recommended.
                  </p>
                </div>
                <div class="flex gap-md items-start bg-white/5 p-md rounded-lg">
                  <span class="material-symbols-outlined text-secondary-fixed mt-1">bolt</span>
                  <p class="font-body-md text-body-md text-on-primary-container">
                    <strong class="text-white">New Registrations</strong> have increased by 5 since Monday, primarily in Primary Section.
                  </p>
                </div>
              </div>
            </div>
            <button class="mt-xl w-full border border-on-primary-container/30 text-white font-label-md py-sm rounded-lg hover:bg-white/10 active:scale-95 transition-all relative z-10">
              Generate Full Report
            </button>
          </div>
        </div>

        {/* Main Analytics Canvas (Spans 8 columns) */}
        <div class="col-span-12 lg:col-span-8 flex flex-col gap-lg">
          {/* Weekly Attendance Trend Chart Card */}
          <div class="bg-surface-container-lowest rounded-xl p-lg shadow-sm border border-outline-variant hover-lift">
            <div class="flex justify-between items-start mb-lg">
              <div>
                <h3 class="font-headline-sm text-headline-sm text-primary">Weekly Attendance Trend</h3>
                <p class="text-label-sm text-on-surface-variant font-medium">Daily average: 94.2%</p>
              </div>
              <div class="flex items-center gap-xs text-secondary font-label-md font-bold">
                <span class="material-symbols-outlined text-[18px]">north</span>
                2.4%
              </div>
            </div>
            <div class="h-44 flex items-end justify-between gap-md relative border-b border-outline-variant px-4">
              {weeklyTrend.map((t) => (
                <div key={t.day} class="flex-1 flex flex-col items-center gap-sm h-full justify-end relative group">
                  <div class="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-on-primary text-xs px-2 py-1 rounded shadow-md pointer-events-none z-20">
                    {t.pct}
                  </div>
                  <div class="w-full max-w-[40px] bg-primary/10 rounded-t-lg relative overflow-hidden h-full flex items-end">
                    <div
                      class="w-full bg-primary rounded-t-lg transition-all duration-1000 ease-out"
                      style={{ height: animateBars ? t.pct : '0%' }}
                    ></div>
                  </div>
                  <span class="text-label-sm text-on-surface-variant font-bold">{t.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fee Collection Trend Chart Card */}
          <div class="bg-surface-container-lowest rounded-xl p-lg shadow-sm border border-outline-variant hover-lift">
            <div class="flex justify-between items-center mb-md">
              <h3 class="font-headline-sm text-headline-sm text-primary">Fee Collection Trend</h3>
              <div class="flex gap-md text-xs text-on-surface-variant">
                <span class="flex items-center gap-1 font-bold"><span class="w-3 h-3 rounded-full bg-primary inline-block"></span> Expected</span>
                <span class="flex items-center gap-1 font-bold"><span class="w-3 h-3 rounded-full bg-secondary inline-block"></span> Collected</span>
              </div>
            </div>
            <div class="h-36 flex items-end justify-between gap-4 border-b border-outline-variant px-4">
              {feeTrend.map((f) => (
                <div key={f.month} class="flex-1 flex flex-col items-center gap-xs h-full justify-end relative group">
                  <div class="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-on-primary text-xs px-2 py-1 rounded shadow-md pointer-events-none z-20">
                    {f.label}
                  </div>
                  <div class="w-full max-w-[48px] bg-primary/20 rounded-t-md relative h-full flex items-end overflow-hidden">
                    <div
                      class="w-full bg-primary rounded-t-md transition-all duration-1000 ease-out absolute bottom-0"
                      style={{ height: animateBars ? f.expected : '0%' }}
                    >
                      <div
                        class="w-full bg-secondary rounded-t-md transition-all duration-1000 ease-out absolute bottom-0"
                        style={{ height: animateBars ? f.collected : '0%' }}
                      ></div>
                    </div>
                  </div>
                  <span class="text-xs text-on-surface-variant font-bold">{f.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sectional Performance Matrix */}
          <div class="bg-surface-container-lowest rounded-xl p-lg shadow-sm border border-outline-variant hover-lift">
            <h3 class="font-headline-sm text-headline-sm text-primary mb-md">Sectional Performance Matrix</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-surface-container-low border-b border-outline-variant">
                    <th class="px-md py-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Section</th>
                    <th class="px-md py-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Students</th>
                    <th class="px-md py-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Attendance</th>
                    <th class="px-md py-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Pass Rate</th>
                    <th class="px-md py-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Fee Collection</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/30">
                  {mockSectionPerformance.map((row) => (
                    <tr key={row.section} class="hover:bg-surface-container-low transition-colors">
                      <td class="px-md py-sm font-body-md text-on-surface font-bold">{row.section}</td>
                      <td class="px-md py-sm font-body-md text-on-surface-variant">{row.students}</td>
                      <td class="px-md py-sm font-body-md text-secondary font-bold">{row.attendance}</td>
                      <td class="px-md py-sm font-body-md text-on-surface">{row.passRate}</td>
                      <td class="px-md py-sm font-body-md text-on-surface font-bold">{row.feeCollected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
