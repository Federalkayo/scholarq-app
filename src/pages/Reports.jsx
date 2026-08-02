import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';

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

function normalizeLabel(str = '') {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export default function Reports() {
  const [animateBars, setAnimateBars] = useState(false);
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [weekAttendance, setWeekAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const last7Days = useMemo(() => getLast7Days(), []);
  const todayISO = last7Days[last7Days.length - 1].iso;

  // NOTE: placeholder data — a real monthly trend needs fee invoices
  // tagged with a `month` field over several months, which we've just
  // started collecting. Swap this for a real computed trend once
  // there are 2+ months of tagged data.
  const feeTrend = [
    { month: 'Aug', expected: '75%', collected: '65%', label: '$80k' },
    { month: 'Sep', expected: '85%', collected: '78%', label: '$95k' },
    { month: 'Oct', expected: '95%', collected: '88%', label: '$124k' },
    { month: 'Nov (Est)', expected: '100%', collected: '70%', label: '$140k (Est)' }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setAnimateBars(true), 150);
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

  const weeklyTrend = last7Days.map((day) => {
    const dayRecords = weekAttendance.filter((a) => a.date === day.iso);
    const presentCount = dayRecords.filter((a) => a.status === 'Present').length;
    const pct = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;
    return { day: day.label, pct: `${Math.round(pct)}%`, hasData: dayRecords.length > 0 };
  });

  const todayRecords = weekAttendance.filter((a) => a.date === todayISO);
  const todayPresentCount = todayRecords.filter((a) => a.status === 'Present').length;
  const todayRate = totalStudents > 0 ? Math.round((todayPresentCount / totalStudents) * 100) : 0;

  const sectionRows = useMemo(() => {
    const groups = {};
    students.forEach((s) => {
      const key = `${s.grade || 'Unassigned'} ${s.section || ''}`.trim();
      if (!groups[key]) groups[key] = { section: key, students: [] };
      groups[key].students.push(s);
    });

    return Object.values(groups).map((group) => {
      const sectionStudentIds = group.students.map((s) => s.id);
      const sectionToday = todayRecords.filter((a) => sectionStudentIds.includes(a.studentId));
      const sectionPresent = sectionToday.filter((a) => a.status === 'Present').length;
      const attendancePct =
        group.students.length > 0 ? Math.round((sectionPresent / group.students.length) * 100) : 0;

      const normalizedSection = normalizeLabel(group.section);
      const sectionFees = fees.filter((f) => normalizeLabel(f.classSec) === normalizedSection);
      const sectionCollected = sectionFees
        .filter((f) => f.status === 'Paid')
        .reduce((sum, f) => sum + (f.amount || 0), 0);
      const sectionTotal = sectionFees.reduce((sum, f) => sum + (f.amount || 0), 0);
      const feeCollectedPct = sectionTotal > 0 ? Math.round((sectionCollected / sectionTotal) * 100) : null;

      return {
        section: group.section,
        studentCount: group.students.length,
        attendancePct,
        feeCollectedPct
      };
    });
  }, [students, fees, todayRecords]);

  return (
    <div class="p-xl max-w-container-max mx-auto animate-fadeIn">
      <div class="mb-xl flex flex-wrap justify-between items-end gap-md">
        <div>
          <h2 class="font-display-lg text-display-lg text-primary">Reports & Analytics</h2>
          <p class="font-body-lg text-body-lg text-on-surface-variant">
            Live institutional data from Firestore.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-lg">
        {/* AI Summary Card — honest placeholder until Gemini is wired */}
        <div class="col-span-12 lg:col-span-4 flex flex-col gap-lg">
          <div class="bg-primary text-on-primary rounded-xl p-lg shadow-sm relative overflow-hidden h-full flex flex-col justify-between hover-lift">
            <div class="absolute -right-8 -top-8 opacity-10 pointer-events-none">
              <span class="material-symbols-outlined text-[160px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
            </div>
            <div class="relative z-10">
              <div class="flex items-center gap-xs mb-md">
                <span class="material-symbols-outlined text-secondary-fixed">auto_awesome</span>
                <h3 class="font-label-sm text-label-sm uppercase tracking-widest text-on-primary-container font-bold">
                  Weekly Summary
                </h3>
              </div>
              <h4 class="font-headline-md text-headline-md mb-sm text-white">AI Insights</h4>
              <p class="text-body-md text-on-primary-container/80 bg-white/5 p-md rounded-lg">
                AI-generated insights aren't connected yet — this will summarize attendance, fees, and enrollment trends automatically once Gemini is wired in.
              </p>
            </div>
            <button
              disabled
              class="mt-xl w-full border border-on-primary-container/30 text-white/50 font-label-md py-sm rounded-lg cursor-not-allowed relative z-10"
            >
              Coming soon
            </button>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-8 flex flex-col gap-lg">
          {/* Weekly Attendance Trend — real */}
          <div class="bg-surface-container-lowest rounded-xl p-lg shadow-sm border border-outline-variant hover-lift">
            <div class="flex justify-between items-start mb-lg">
              <div>
                <h3 class="font-headline-sm text-headline-sm text-primary">Weekly Attendance Trend</h3>
                <p class="text-label-sm text-on-surface-variant font-medium">Today: {todayRate}%</p>
              </div>
            </div>
            {totalStudents === 0 ? (
              <p class="text-on-surface-variant text-body-md py-lg text-center">
                Add students first to see attendance trends.
              </p>
            ) : (
              <div class="h-44 flex items-end justify-between gap-md relative border-b border-outline-variant px-4">
                {weeklyTrend.map((t) => (
                  <div key={t.day} class={`flex-1 flex flex-col items-center gap-sm h-full justify-end relative group ${!t.hasData ? 'opacity-40' : ''}`}>
                    <div class="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-on-primary text-xs px-2 py-1 rounded shadow-md pointer-events-none z-20">
                      {t.hasData ? t.pct : 'No data'}
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
            )}
          </div>

          {/* Fee Collection Trend — placeholder, matches Fees.jsx disclaimer */}
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
            <p class="text-[11px] text-on-surface-variant mt-sm italic">
              Trend chart uses placeholder data until we have fee history over time.
            </p>
          </div>

          {/* Sectional Performance Matrix — real, grouped from live data */}
          <div class="bg-surface-container-lowest rounded-xl p-lg shadow-sm border border-outline-variant hover-lift">
            <h3 class="font-headline-sm text-headline-sm text-primary mb-md">Sectional Performance Matrix</h3>
            {loading ? (
              <p class="text-on-surface-variant text-body-md py-lg text-center">Loading…</p>
            ) : sectionRows.length === 0 ? (
              <p class="text-on-surface-variant text-body-md py-lg text-center">No students yet.</p>
            ) : (
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-surface-container-low border-b border-outline-variant">
                      <th class="px-md py-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Section</th>
                      <th class="px-md py-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Students</th>
                      <th class="px-md py-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Attendance (Today)</th>
                      <th class="px-md py-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Pass Rate</th>
                      <th class="px-md py-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Fee Collection</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-outline-variant/30">
                    {sectionRows.map((row) => (
                      <tr key={row.section} class="hover:bg-surface-container-low transition-colors">
                        <td class="px-md py-sm font-body-md text-on-surface font-bold">{row.section}</td>
                        <td class="px-md py-sm font-body-md text-on-surface-variant">{row.studentCount}</td>
                        <td class="px-md py-sm font-body-md text-secondary font-bold">{row.attendancePct}%</td>
                        <td class="px-md py-sm font-body-md text-on-surface-variant italic">Not tracked yet</td>
                        <td class="px-md py-sm font-body-md text-on-surface font-bold">
                          {row.feeCollectedPct === null ? '—' : `${row.feeCollectedPct}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}