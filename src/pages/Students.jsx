import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import StatusChip from '../components/ui/StatusChip';
import Avatar from '../components/ui/Avatar';

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function Students() {
  const { searchQuery } = useOutletContext();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'students'),
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || 'Unnamed Student',
            grade: data.grade || '',
            section: data.section || '',
            guardian: data.guardian || '',
            guardianContact: data.guardianContact || '',
            feeStatus: data.feeStatus || 'Pending',
            attendance: typeof data.attendance === 'number' ? data.attendance : 0,
            initials: getInitials(data.name)
          };
        });
        setStudents(list);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load students:', err);
        setError('Could not load students. Please try again.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const filteredStudents = students.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.guardian.toLowerCase().includes(q) ||
      s.grade.toLowerCase().includes(q)
    );
  });

  const totalStudents = students.length;
  const avgAttendance =
    totalStudents > 0
      ? (students.reduce((sum, s) => sum + s.attendance, 0) / totalStudents).toFixed(1)
      : '0.0';
  const overdueCount = students.filter((s) => s.feeStatus === 'Overdue').length;

  return (
    <div class="p-xl max-w-container-max mx-auto relative">
      {/* Page Header */}
      <div class="flex flex-wrap justify-between items-end mb-lg gap-md">
        <div>
          <h2 class="font-display-lg text-display-lg text-primary">Student Management</h2>
          <p class="font-body-md text-body-md text-on-surface-variant mt-1">
            Managing {totalStudents} active student{totalStudents !== 1 ? 's' : ''} across all sections.
          </p>
        </div>
        <div class="flex gap-sm">
          <button class="flex items-center gap-xs px-md py-2 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-high transition-all">
            <span class="material-symbols-outlined text-[20px]">filter_list</span>
            Filters
          </button>
          <button class="flex items-center gap-xs px-md py-2 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-high transition-all">
            <span class="material-symbols-outlined text-[20px]">file_download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Overview (Bento Style) */}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
        <div class="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant/30">
          <p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">
            Total Enrollment
          </p>
          <div class="flex items-end justify-between">
            <span class="font-display-lg text-display-lg text-on-surface">{totalStudents}</span>
          </div>
        </div>
        <div class="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant/30">
          <p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">
            Avg Attendance
          </p>
          <div class="flex items-end justify-between">
            <span class="font-display-lg text-display-lg text-on-surface">{avgAttendance}%</span>
          </div>
        </div>
        <div class="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant/30">
          <p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">
            Overdue Fees
          </p>
          <div class="flex items-end justify-between">
            <span class="font-display-lg text-display-lg text-error">{overdueCount}</span>
          </div>
        </div>
        <div class="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant/30">
          <p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">
            New Inquiries
          </p>
          <div class="flex items-end justify-between">
            <span class="font-display-lg text-display-lg text-primary">—</span>
            <span class="font-label-md text-label-md text-on-surface-variant">Not tracked yet</span>
          </div>
        </div>
      </div>

      {/* Student Data Table */}
      <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        {loading ? (
          <div class="p-xl text-center text-on-surface-variant">Loading students…</div>
        ) : error ? (
          <div class="p-xl text-center text-error">{error}</div>
        ) : filteredStudents.length === 0 ? (
          <div class="p-xl text-center text-on-surface-variant">
            {searchQuery ? 'No students match your search.' : 'No students yet. Add your first student in Firestore to see them here.'}
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container-low border-b border-outline-variant">
                  <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Student</th>
                  <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Class / Section</th>
                  <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Guardian Contact</th>
                  <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Fee Status</th>
                  <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Attendance</th>
                  <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/30">
                {filteredStudents.map((st) => (
                  <tr
                    key={st.id}
                    onClick={() => setSelectedStudent(st)}
                    class="hover:bg-surface-container-low cursor-pointer transition-colors group"
                  >
                    <td class="px-lg py-md">
                      <div class="flex items-center gap-md">
                        <Avatar initials={st.initials} alt={st.name} />
                        <div>
                          <p class="font-body-md text-body-md text-on-surface font-semibold">{st.name}</p>
                          <p class="text-xs text-on-surface-variant">ID: {st.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-lg py-md">
                      <div class="font-body-md text-body-md text-on-surface">{st.grade}</div>
                      <div class="text-xs text-on-surface-variant">{st.section}</div>
                    </td>
                    <td class="px-lg py-md">
                      <p class="font-body-md text-body-md text-on-surface">{st.guardian}</p>
                      <p class="text-xs text-on-surface-variant">{st.guardianContact}</p>
                    </td>
                    <td class="px-lg py-md">
                      <StatusChip status={st.feeStatus} />
                    </td>
                    <td class="px-lg py-md">
                      <div class="flex items-center gap-sm">
                        <div class="w-16 h-2 bg-surface-container-high rounded-full overflow-hidden">
                          <div
                            class={`h-full ${st.attendance < 80 ? 'bg-error' : 'bg-secondary'}`}
                            style={{ width: `${st.attendance}%` }}
                          ></div>
                        </div>
                        <span class="font-label-md text-label-md text-on-surface">{st.attendance}%</span>
                      </div>
                    </td>
                    <td class="px-lg py-md" onClick={(e) => e.stopPropagation()}>
                      <button class="text-outline hover:text-primary transition-colors">
                        <span class="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Detail Slide-over Drawer */}
      {selectedStudent && (
        <div class="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div class="w-full max-w-md bg-surface-container-lowest h-full shadow-2xl p-xl overflow-y-auto flex flex-col">
            <div class="flex justify-between items-center mb-lg">
              <h3 class="font-headline-sm text-primary">Student Profile</h3>
              <button
                onClick={() => setSelectedStudent(null)}
                class="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="text-center mb-lg">
              <Avatar initials={selectedStudent.initials} size="w-24 h-24" border="mx-auto mb-md border-4 border-primary-fixed" />
              <h4 class="font-headline-md text-on-surface">{selectedStudent.name}</h4>
              <p class="text-body-md text-on-surface-variant">{selectedStudent.id.slice(0, 8)}</p>
            </div>
            <div class="space-y-md border-t border-outline-variant pt-md">
              <div class="flex justify-between py-xs border-b border-outline-variant/30">
                <span class="text-on-surface-variant font-label-md">Grade & Section</span>
                <span class="font-bold text-on-surface">{selectedStudent.grade} ({selectedStudent.section})</span>
              </div>
              <div class="flex justify-between py-xs border-b border-outline-variant/30">
                <span class="text-on-surface-variant font-label-md">Guardian</span>
                <span class="font-bold text-on-surface">{selectedStudent.guardian}</span>
              </div>
              <div class="flex justify-between py-xs border-b border-outline-variant/30">
                <span class="text-on-surface-variant font-label-md">Contact</span>
                <span class="font-bold text-on-surface">{selectedStudent.guardianContact}</span>
              </div>
              <div class="flex justify-between py-xs border-b border-outline-variant/30">
                <span class="text-on-surface-variant font-label-md">Fee Status</span>
                <StatusChip status={selectedStudent.feeStatus} />
              </div>
              <div class="flex justify-between py-xs border-b border-outline-variant/30">
                <span class="text-on-surface-variant font-label-md">Attendance Rate</span>
                <span class="font-bold text-on-surface">{selectedStudent.attendance}%</span>
              </div>
            </div>
            <div class="mt-auto pt-lg flex gap-md">
              <button class="flex-1 py-sm bg-primary text-on-primary rounded-lg font-label-md">
                Edit Record
              </button>
              <button class="flex-1 py-sm border border-outline-variant text-on-surface rounded-lg font-label-md">
                Contact Guardian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}