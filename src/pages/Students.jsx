import React, { useState, useEffect } from 'react';
import { useOutletContext, useLocation, useSearchParams } from 'react-router-dom';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadFileToStorage } from '../utils/storage';
import { generateReportComment } from '../lib/groq';
import StatusChip from '../components/ui/StatusChip';
import Avatar from '../components/ui/Avatar';

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

const GRADE_OPTIONS = [
  'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
];
const SECTION_OPTIONS = ['Section A', 'Section B', 'Section C', 'Section D'];

const emptyForm = {
  name: '',
  grade: GRADE_OPTIONS[4],
  section: SECTION_OPTIONS[0],
  guardian: '',
  guardianContact: '',
  feeStatus: 'Pending',
  attendance: '',
  avatar: ''
};

export default function Students() {
  const { searchQuery } = useOutletContext();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // AI report card comment state
  const [aiComment, setAiComment] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiCopied, setAiCopied] = useState(false);

  useEffect(() => {
    if (location.state?.openNewRegistration || searchParams.get('register') === 'true') {
      setForm(emptyForm);
      setModalMode('add');
      setSaveError('');
      setShowModal(true);
      if (searchParams.get('register')) {
        searchParams.delete('register');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [location.state, searchParams]);

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
            avatar: data.avatar || '',
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

  useEffect(() => {
    if (!showModal) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showModal]);

  useEffect(() => {
    setAiComment('');
    setAiError('');
    setAiCopied(false);
  }, [selectedStudent]);

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

  const openAddModal = () => {
    setForm(emptyForm);
    setModalMode('add');
    setSaveError('');
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setForm({
      id: student.id,
      name: student.name,
      grade: student.grade || GRADE_OPTIONS[4],
      section: student.section || SECTION_OPTIONS[0],
      guardian: student.guardian,
      guardianContact: student.guardianContact,
      feeStatus: student.feeStatus,
      attendance: student.attendance,
      avatar: student.avatar || ''
    });
    setModalMode('edit');
    setSaveError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(emptyForm);
    setSaveError('');
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleStudentAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadFileToStorage(file, 'student-avatars');
      setForm((prev) => ({ ...prev, avatar: url }));
    } catch (err) {
      console.error('Failed to upload student image:', err);
      setSaveError('Failed to upload picture. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDrawerAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudent) return;
    setUploadingImage(true);
    try {
      const url = await uploadFileToStorage(file, 'student-avatars');
      await updateDoc(doc(db, 'students', selectedStudent.id), { avatar: url });
      setSelectedStudent((prev) => ({ ...prev, avatar: url }));
    } catch (err) {
      console.error('Failed to update student profile picture:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setSaveError('Student name is required.');
      return;
    }
    setSaving(true);
    setSaveError('');

    const payload = {
      name: form.name.trim(),
      grade: form.grade,
      section: form.section,
      guardian: form.guardian.trim(),
      guardianContact: form.guardianContact.trim(),
      feeStatus: form.feeStatus,
      attendance: form.attendance === '' ? 0 : Number(form.attendance),
      avatar: form.avatar || ''
    };

    try {
      if (modalMode === 'add') {
        await addDoc(collection(db, 'students'), payload);
      } else {
        await updateDoc(doc(db, 'students', form.id), payload);
        if (selectedStudent && selectedStudent.id === form.id) {
          setSelectedStudent({ ...selectedStudent, ...payload, initials: getInitials(payload.name) });
        }
      }
      closeModal();
    } catch (err) {
      console.error('Failed to save student:', err);
      setSaveError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateComment = async () => {
    if (!selectedStudent) return;
    setAiLoading(true);
    setAiError('');
    setAiCopied(false);
    try {
      const comment = await generateReportComment(selectedStudent);
      setAiComment(comment);
    } catch (err) {
      console.error('Failed to generate AI comment:', err);
      setAiError('Could not generate a comment right now. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyComment = async () => {
    try {
      await navigator.clipboard.writeText(aiComment);
      setAiCopied(true);
      setTimeout(() => setAiCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div class="p-xl max-w-container-max mx-auto relative">
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
          <button
            onClick={openAddModal}
            class="flex items-center gap-xs px-md py-2 bg-primary text-on-primary rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <span class="material-symbols-outlined text-[20px]">person_add</span>
            Add Student
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
        <div class="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant/30">
          <p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">Total Enrollment</p>
          <span class="font-display-lg text-display-lg text-on-surface">{totalStudents}</span>
        </div>
        <div class="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant/30">
          <p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">Avg Attendance</p>
          <span class="font-display-lg text-display-lg text-on-surface">{avgAttendance}%</span>
        </div>
        <div class="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant/30">
          <p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">Overdue Fees</p>
          <span class="font-display-lg text-display-lg text-error">{overdueCount}</span>
        </div>
        <div class="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant/30">
          <p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">New Inquiries</p>
          <span class="font-label-md text-label-md text-on-surface-variant">Not tracked yet</span>
        </div>
      </div>

      <div class="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
        {loading ? (
          <div class="p-xl text-center text-on-surface-variant">Loading students…</div>
        ) : error ? (
          <div class="p-xl text-center text-error">{error}</div>
        ) : filteredStudents.length === 0 ? (
          <div class="p-xl text-center text-on-surface-variant">
            {searchQuery ? 'No students match your search.' : 'No students yet — click "Add Student" to get started.'}
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
                        <Avatar src={st.avatar} initials={st.initials} alt={st.name} />
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
                      <button
                        onClick={() => openEditModal(st)}
                        class="text-outline hover:text-primary transition-colors"
                        title="Edit student"
                      >
                        <span class="material-symbols-outlined">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedStudent && (
        <div class="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs" onClick={() => setSelectedStudent(null)}>
          <div class="w-full max-w-md bg-surface-container-lowest h-full shadow-2xl p-xl overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
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
              <div class="relative inline-block mx-auto mb-md group">
                <Avatar src={selectedStudent.avatar} initials={selectedStudent.initials} size="w-24 h-24" border="border-4 border-primary-fixed" />
                <label
                  title="Update profile picture"
                  class="absolute bottom-0 right-0 bg-primary text-on-primary p-2 rounded-full shadow-md hover:scale-110 transition-all cursor-pointer flex items-center justify-center"
                >
                  <span class="material-symbols-outlined text-[16px]">{uploadingImage ? 'sync' : 'photo_camera'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDrawerAvatarUpload}
                    class="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>
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

            <div class="mt-lg pt-md border-t border-outline-variant">
              <div class="flex items-center justify-between mb-sm">
                <h4 class="font-label-md text-on-surface-variant flex items-center gap-xs">
                  <span class="material-symbols-outlined text-[18px] text-primary">auto_awesome</span>
                  AI Report Card Comment
                </h4>
              </div>

              {aiError && (
                <div class="bg-error-container text-error text-label-sm px-md py-sm rounded-lg mb-sm">
                  {aiError}
                </div>
              )}

              {aiComment ? (
                <div>
                  <textarea
                    value={aiComment}
                    onChange={(e) => setAiComment(e.target.value)}
                    rows={4}
                    class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface bg-surface outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  />
                  <div class="flex gap-sm mt-sm">
                    <button
                      onClick={handleCopyComment}
                      class="flex-1 flex items-center justify-center gap-xs py-1.5 border border-outline-variant text-on-surface rounded-lg font-label-sm hover:bg-surface-container-high transition-colors"
                    >
                      <span class="material-symbols-outlined text-[16px]">
                        {aiCopied ? 'check' : 'content_copy'}
                      </span>
                      {aiCopied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={handleGenerateComment}
                      disabled={aiLoading}
                      class="flex-1 flex items-center justify-center gap-xs py-1.5 border border-outline-variant text-on-surface rounded-lg font-label-sm hover:bg-surface-container-high transition-colors disabled:opacity-50"
                    >
                      <span class="material-symbols-outlined text-[16px]">refresh</span>
                      Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateComment}
                  disabled={aiLoading}
                  class="w-full flex items-center justify-center gap-xs py-2 bg-primary/10 text-primary rounded-lg font-label-md hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <span class="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin"></span>
                      Generating…
                    </>
                  ) : (
                    <>
                      <span class="material-symbols-outlined text-[18px]">auto_awesome</span>
                      Generate Comment
                    </>
                  )}
                </button>
              )}
              <p class="text-[11px] text-on-surface-variant mt-xs italic">
                AI-generated draft based on attendance data — always review before use.
              </p>
            </div>

            <div class="mt-lg pt-lg flex gap-md">
              <button
                onClick={() => openEditModal(selectedStudent)}
                class="flex-1 py-sm bg-primary text-on-primary rounded-lg font-label-md hover:opacity-90 transition-opacity"
              >
                Edit Record
              </button>
              <button class="flex-1 py-sm border border-outline-variant text-on-surface rounded-lg font-label-md hover:bg-surface-container-high transition-colors">
                Contact Guardian
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div
          class="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 backdrop-blur-xs p-md overflow-y-auto pt-24"
          onClick={closeModal}
        >
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            class="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-2xl p-xl max-h-[90vh] overflow-y-auto"
          >
            <div class="flex items-center gap-md mb-lg">
              <div class="relative group">
                <Avatar src={form.avatar} initials={getInitials(form.name) || '?'} size="w-16 h-16" />
                <label
                  title="Upload student picture"
                  class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                >
                  <span class="material-symbols-outlined text-white text-[20px]">{uploadingImage ? 'sync' : 'photo_camera'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleStudentAvatarUpload}
                    class="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>
              <div class="flex-1">
                <h3 class="font-headline-sm text-primary">
                  {modalMode === 'add' ? 'Add Student' : 'Edit Student'}
                </h3>
                <p class="text-label-sm text-on-surface-variant">
                  {modalMode === 'add' ? 'Enrolls a new student in the school.' : "Updates this student's record."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                class="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            {saveError && (
              <div class="bg-error-container text-error text-label-md px-md py-sm rounded-lg mb-md">
                {saveError}
              </div>
            )}

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <div class="sm:col-span-2">
                <label class="block font-label-md text-on-surface-variant mb-xs">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  required
                  autoFocus
                  placeholder="e.g. Julian Thorne"
                  class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                />
              </div>

              <div>
                <label class="block font-label-md text-on-surface-variant mb-xs">Grade</label>
                <select
                  value={form.grade}
                  onChange={(e) => handleFormChange('grade', e.target.value)}
                  class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                >
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label class="block font-label-md text-on-surface-variant mb-xs">Section</label>
                <select
                  value={form.section}
                  onChange={(e) => handleFormChange('section', e.target.value)}
                  class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                >
                  {SECTION_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label class="block font-label-md text-on-surface-variant mb-xs">Guardian Name</label>
                <input
                  type="text"
                  value={form.guardian}
                  onChange={(e) => handleFormChange('guardian', e.target.value)}
                  placeholder="e.g. Sarah Thorne"
                  class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                />
              </div>

              <div>
                <label class="block font-label-md text-on-surface-variant mb-xs">Guardian Contact</label>
                <input
                  type="tel"
                  value={form.guardianContact}
                  onChange={(e) => handleFormChange('guardianContact', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                />
              </div>

              <div>
                <label class="block font-label-md text-on-surface-variant mb-xs">Fee Status</label>
                <select
                  value={form.feeStatus}
                  onChange={(e) => handleFormChange('feeStatus', e.target.value)}
                  class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div>
                <label class="block font-label-md text-on-surface-variant mb-xs">Attendance %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.attendance}
                  onChange={(e) => handleFormChange('attendance', e.target.value)}
                  placeholder="98"
                  class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                />
              </div>
            </div>

            <div class="flex gap-md mt-xl">
              <button
                type="submit"
                disabled={saving || uploadingImage}
                class="flex-1 bg-primary text-on-primary py-sm rounded-lg font-label-md hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving…' : modalMode === 'add' ? 'Add Student' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                class="flex-1 border border-outline-variant text-on-surface py-sm rounded-lg font-label-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}