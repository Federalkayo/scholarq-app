import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import StatCard from '../components/ui/StatCard';

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-US', { weekday: 'short' })
    });
  }
  return days;
}

export default function Dashboard() {
  const [animateBars, setAnimateBars] = useState(false);
  const [animateRing, setAnimateRing] = useState(false);

  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [weekAttendance, setWeekAttendance] = useState([]); // raw docs for last 7 days
  const [loading, setLoading] = useState(true);

  const last7Days = useMemo(() => getLast7Days(), []);
  const todayISO = last7Days[last7Days.length - 1].iso;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateBars(true);
      setAnimateRing(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const unsubFees = onSnapshot(collection(db, 'fees'), (snap) => {
      setFees(snap.docs.map((d) => d.data()));
    });
    const q = query(collection(db, 'attendance'), where('date', 'in', last7Days.map((d) => d.iso)));
    const unsubAttendance = onSnapshot(q, (snap) => {
      setWeekAttendance(snap.docs.map((d) => d.data()));
    });

    return () => {
      unsubStudents();
      unsubFees();
      unsubAttendance();
    };
  }, [last7Days]);

  const totalStudents = students.length;

  const totalOutstanding = fees
    .filter((f) => f.status === 'Overdue' || f.status === 'Pending')
    .reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalCollected = fees
    .filter((f) => f.status === 'Paid')
    .reduce((sum, f) => sum + (f.amount || 0), 0);
  const feeTotal = totalOutstanding + totalCollected;
  const collectedPct = feeTotal > 0 ? Math.round((totalCollected / feeTotal) * 100) : 0;
  const ringOffset = 502.6 - (502.6 * collectedPct) / 100;

  const todayRecords = weekAttendance.filter((a) => a.date === todayISO);
  const todayPresent = todayRecords.filter((a) => a.status === 'Present').length;
  const todayRate = totalStudents > 0 ? Math.round((todayPresent / totalStudents) * 100) : 0;

  const overdueCount = fees.filter((f) => f.status === 'Overdue').length;

  const weeklyTrend = last7Days.map((day) => {
    const dayRecords = weekAttendance.filter((a) => a.date === day.iso);
    const presentCount = dayRecords.filter((a) => a.status === 'Present').length;
    const hasData = dayRecords.length > 0;
    const pct = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;
    return { day: day.label, height: `${pct}%`, active: hasData };
  });

  const kpis = [
    {
      id: 'students',
      label: 'Total Students',
      value: totalStudents,
      icon: 'group',
      iconBg: 'bg-primary-fixed',
      iconColor: 'text-primary'
    },
    {
      id: 'attendance',
      label: "Today's Attendance",
      value: `${todayRate}%`,
      icon: 'calendar_today',
      iconBg: 'bg-secondary-fixed',
      iconColor: 'text-secondary'
    },
    {
      id: 'fees',
      label: 'Fees Collected',
      value: `${collectedPct}%`,
      icon: 'payments',
      iconBg: 'bg-tertiary-fixed',
      iconColor: 'text-tertiary'
    },
    {
      id: 'overdue',
      label: 'Overdue Invoices',
      value: overdueCount,
      icon: 'error',
      iconBg: 'bg-error-container',
      iconColor: 'text-error'
    }
  ];

  return (
    <div class="p-xl max-w-container-max mx-auto">
      <div class="mb-xl flex flex-wrap justify-between items-end gap-md">
        <div>
          <h2 class="font-display-lg text-display-lg text-primary">Academic Overview</h2>
          <p class="font-body-md text-body-md text-on-surface-variant mt-1">
            {loading ? 'Loading live data…' : <span class="text-secondary font-bold">Live data from Firestore</span>}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-lg">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            iconBg={kpi.iconBg}
            iconColor={kpi.iconColor}
          />
        ))}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Weekly Attendance Trend — real data, last 7 days */}
        <div class="lg:col-span-2 bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant hover-lift">
          <div class="flex justify-between items-center mb-xl">
            <h3 class="font-headline-sm text-headline-sm text-primary">Weekly Attendance Trend</h3>
            <div class="flex gap-md items-center">
              <div class="flex items-center gap-xs">
                <span class="w-3 h-3 bg-primary rounded-full"></span>
                <span class="text-label-sm text-on-surface-variant font-medium">Present rate</span>
              </div>
            </div>
          </div>
          {totalStudents === 0 ? (
            <p class="text-on-surface-variant text-body-md py-xl text-center">
              Add students first to see attendance trends.
            </p>
          ) : (
            <div class="flex items-end justify-between h-64 gap-lg px-4 border-b border-outline-variant">
              {weeklyTrend.map((item) => (
                <div
                  key={item.day}
                  class={`flex-1 flex flex-col items-center group relative ${!item.active ? 'opacity-40' : ''}`}
                >
                  <div class="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-on-primary text-xs px-2 py-1 rounded shadow-md z-20 pointer-events-none">
                    {item.active ? item.height : 'No data'}
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
          )}
        </div>

        {/* Fee Progress — real data */}
        <div class="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant flex flex-col hover-lift">
          <h3 class="font-headline-sm text-headline-sm text-primary mb-xl">Fee Collection</h3>
          <div class="flex-1 flex flex-col items-center justify-center relative min-h-[192px]">
            <svg class="w-48 h-48 -rotate-90">
              <circle cx="96" cy="96" r="80" fill="transparent" stroke="currentColor" strokeWidth="16" class="text-surface-container-high" />
              <circle
                cx="96"
                cy="96"
                r="80"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="16"
                strokeDasharray="502.6"
                strokeDashoffset={animateRing ? ringOffset : '502.6'}
                strokeLinecap="round"
                class="text-secondary transition-all duration-1000"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="font-display-lg text-display-lg text-on-surface">{collectedPct}%</span>
              <span class="text-label-sm text-on-surface-variant font-medium">Collected</span>
            </div>
          </div>
          <div class="mt-xl space-y-md">
            <div class="flex justify-between items-center text-body-md">
              <span class="flex items-center gap-xs">
                <span class="w-2 h-2 rounded-full bg-secondary"></span> Received
              </span>
              <span class="font-bold text-on-surface">${totalCollected.toLocaleString()}</span>
            </div>
            <div class="flex justify-between items-center text-body-md">
              <span class="flex items-center gap-xs">
                <span class="w-2 h-2 rounded-full bg-surface-container-high"></span> Outstanding
              </span>
              <span class="font-bold text-on-surface-variant">${totalOutstanding.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity — honest empty state, no activity log exists yet */}
        <div class="lg:col-span-1 bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant hover-lift">
          <h3 class="font-headline-sm text-headline-sm text-primary mb-xl">Recent Activity</h3>
          <p class="text-on-surface-variant text-body-md text-center py-lg">
            Activity logging isn't built yet — coming in a future update.
          </p>
        </div>

        {/* Academic Calendar — honest empty state, no events collection exists yet */}
        <div class="lg:col-span-2 bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant hover-lift">
          <h3 class="font-headline-sm text-headline-sm text-primary mb-xl">Academic Calendar</h3>
          <p class="text-on-surface-variant text-body-md text-center py-lg">
            No events yet — calendar management is coming in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}