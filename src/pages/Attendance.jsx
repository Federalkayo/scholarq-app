import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, onSnapshot, query, where, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import AttendanceToggle from '../components/ui/AttendanceToggle';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import { isStudentInTeacherClasses } from '../utils/classUtils';

const STATUS_FILTERS = ['All', 'Present', 'Absent', 'Late', 'Unmarked'];

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function todayDisplay() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function Attendance() {
  const { userProfile } = useAuth();
  const isTeacher = userProfile?.role === 'teacher';
  const assignedClasses = userProfile?.assignedClasses || ['Class 10A'];
  // selectedClass/selectedSection come from the topbar dropdowns (e.g. "Class 10", "Section A"),
  // shared via Layout's Outlet context. The topbar swaps its search input out for these two
  // selects on this route, so we also keep a page-local search box below.
  const { selectedClass, selectedSection } = useOutletContext();

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const date = todayISO();

  // Real student roster
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'students'),
      (snapshot) => {
        setStudents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load students:', err);
        setError('Could not load the student roster.');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  // Today's attendance records only
  useEffect(() => {
    const q = query(collection(db, 'attendance'), where('date', '==', date));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const map = {};
        snapshot.docs.forEach((d) => {
          const data = d.data();
          map[data.studentId] = data.status;
        });
        setAttendanceMap(map);
      },
      (err) => console.error('Failed to load attendance:', err)
    );
    return unsubscribe;
  }, [date]);

  const filteredStudents = useMemo(() => {
    if (!isTeacher) return students;
    return students.filter((s) => isStudentInTeacherClasses(s, assignedClasses));
  }, [students, isTeacher, assignedClasses]);

  const rollCall = useMemo(
    () =>
      filteredStudents.map((s, idx) => ({
        id: s.id,
        rollNo: idx + 1,
        name: s.name,
        avatar: s.avatar,
        initials: getInitials(s.name),
        classSec: `${s.grade || ''} ${s.section || ''}`.trim(),
        status: attendanceMap[s.id] || 'Unmarked'
      })),
    [filteredStudents, attendanceMap]
  );

  // Matches a student against the topbar's Class / Section selectors
  // (values like "Grade 10" / "Section A", or "All Classes" / "All Sections" as wildcards).
  function matchesTopbarSelection(student) {
    const gradeNum = (student.grade || '').replace(/^Grade\s*/i, '').trim();
    const secLetter = (student.section || '').replace(/^Section\s*/i, '').trim();
    const isAllClasses = !selectedClass || selectedClass === 'All Classes';
    const isAllSections = !selectedSection || selectedSection === 'All Sections';
    const selectedGradeNum = isAllClasses ? '' : selectedClass.replace(/^Grade\s*/i, '').trim();
    const selectedSecLetter = isAllSections ? '' : selectedSection.replace(/^Section\s*/i, '').trim();
    const classMatches = isAllClasses || gradeNum === selectedGradeNum;
    const sectionMatches = isAllSections || secLetter === selectedSecLetter;
    return classMatches && sectionMatches;
  }

  // Search + status + topbar class/section filters applied on top of the role-scoped roll call
  const visibleRollCall = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rollCall.filter((st) => {
      const student = students.find((s) => s.id === st.id);
      const matchesSearch =
        !q ||
        st.name.toLowerCase().includes(q) ||
        st.classSec.toLowerCase().includes(q) ||
        String(st.rollNo).includes(q);
      const matchesStatus = statusFilter === 'All' || st.status === statusFilter;
      const matchesClassSection = student ? matchesTopbarSelection(student) : true;
      return matchesSearch && matchesStatus && matchesClassSection;
    });
  }, [rollCall, students, search, statusFilter, selectedClass, selectedSection]);

  // Deterministic doc ID (date + studentId) means marking a student twice
  // updates the same record instead of creating duplicates.
  const handleStatusChange = async (studentId, newStatus) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;
    try {
      await setDoc(doc(db, 'attendance', `${date}_${studentId}`), {
        studentId,
        studentName: student.name,
        classSec: `${student.grade || ''} ${student.section || ''}`.trim(),
        date,
        status: newStatus
      });
    } catch (err) {
      console.error('Failed to save attendance:', err);
    }
  };

  const markAllPresent = async () => {
    try {
      const batch = writeBatch(db);
      filteredStudents.forEach((s) => {
        const ref = doc(db, 'attendance', `${date}_${s.id}`);
        batch.set(ref, {
          studentId: s.id,
          studentName: s.name,
          classSec: `${s.grade || ''} ${s.section || ''}`.trim(),
          date,
          status: 'Present'
        });
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to mark all present:', err);
    }
  };

  const presentCount = rollCall.filter((s) => s.status === 'Present').length;
  const absentCount = rollCall.filter((s) => s.status === 'Absent').length;
  const lateCount = rollCall.filter((s) => s.status === 'Late').length;
  const total = rollCall.length;
  const attendanceRate = total > 0 ? ((presentCount / total) * 100).toFixed(1) : '0.0';

  return (
    <div class="p-xl max-w-container-max mx-auto">
      <div class="bg-surface-container-lowest rounded-xl shadow-sm p-lg mb-lg flex flex-wrap items-center justify-between gap-lg border border-outline-variant">
        <div class="flex items-center gap-lg">
          <div>
            <p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-base font-bold">
              Daily Attendance
            </p>
            <div class="flex items-baseline gap-xs">
              <span class="text-display-lg font-display-lg text-primary">{attendanceRate}%</span>
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
        <div class="flex-1">
          <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
            <div class="px-lg py-md border-b border-outline-variant bg-surface-container-low flex flex-wrap justify-between items-center gap-md">
              <h2 class="font-headline-sm text-on-surface">Student Roll Call</h2>
              <span class="text-label-sm text-on-surface-variant">{todayDisplay()}</span>
            </div>

            <div class="px-lg py-md border-b border-outline-variant bg-surface-container-lowest flex flex-wrap items-center gap-md">
              <div class="flex flex-wrap gap-xs">
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    class={`px-md py-1 rounded-full text-label-sm border transition-colors ${
                      statusFilter === s
                        ? 'bg-primary text-on-primary border-primary'
                        : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div class="relative ml-auto w-full sm:w-64">
                <span class="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search this roll call..."
                  class="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg pl-8 pr-3 py-1.5 text-label-sm focus:ring-2 focus:ring-primary/20 outline-none text-on-surface"
                />
              </div>
            </div>

            {loading ? (
              <div class="p-xl text-center text-on-surface-variant">Loading roster…</div>
            ) : error ? (
              <div class="p-xl text-center text-error">{error}</div>
            ) : rollCall.length === 0 ? (
              <div class="p-xl text-center text-on-surface-variant">
                No students yet — add some in Firestore first.
              </div>
            ) : visibleRollCall.length === 0 ? (
              <div class="p-xl text-center text-on-surface-variant">
                No students match your search or filters.
              </div>
            ) : (
              <div class="divide-y divide-outline-variant">
                {visibleRollCall.map((st) => (
                  <div
                    key={st.id}
                    class="px-lg py-md hover:bg-surface-container-low transition-colors flex items-center justify-between group"
                  >
                    <div class="flex items-center gap-md">
                      <span class="text-label-sm text-outline w-6 font-bold">{st.rollNo}</span>
                      <Avatar src={st.avatar} initials={st.initials} size="w-10 h-10" />
                      <div>
                        <p class="font-body-md text-body-md text-on-surface font-semibold">{st.name}</p>
                        <p class="text-xs text-on-surface-variant">{st.classSec}</p>
                      </div>
                    </div>
                    <AttendanceToggle
                      value={st.status}
                      onChange={(val) => handleStatusChange(st.id, val)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div class="w-full lg:w-80 space-y-lg">
          <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-lg">
            <h3 class="font-headline-sm text-primary mb-md">Today's Summary</h3>
            <p class="text-body-md text-on-surface-variant">
              {presentCount} of {total} students marked so far today.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}