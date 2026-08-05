import React, { useState } from 'react';
import { GRADE_OPTIONS, FEE_TYPE_OPTIONS, formatCurrency } from '../../constants/fees';

const emptyForm = {
  id: null,
  term: '',
  grade: GRADE_OPTIONS[4],
  feeType: FEE_TYPE_OPTIONS[0],
  amount: '',
  dueDate: ''
};

export default function ClassFeeStructureModal({
  isOpen,
  onClose,
  feeStructures,
  students,
  invoices,
  onSaveStructure,
  onDeleteStructure,
  onGenerateInvoices
}) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [confirmingId, setConfirmingId] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [resultById, setResultById] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  if (!isOpen) return null;

  const knownTerms = Array.from(new Set(feeStructures.map((s) => s.term).filter(Boolean)));

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFormError('');
  };

  const handleEdit = (structure) => {
    setForm({
      id: structure.id,
      term: structure.term,
      grade: structure.grade,
      feeType: structure.feeType,
      amount: structure.amount,
      dueDate: structure.dueDate || ''
    });
    setEditingId(structure.id);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.term.trim()) {
      setFormError('Term is required, e.g. "First Term 2025/2026".');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setFormError('Enter a valid fee amount.');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      await onSaveStructure({
        id: form.id,
        term: form.term.trim(),
        grade: form.grade,
        feeType: form.feeType,
        amount: Number(form.amount),
        dueDate: form.dueDate
      });
      resetForm();
    } catch (err) {
      console.error('Failed to save class fee structure:', err);
      setFormError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await onDeleteStructure(id);
    } finally {
      setDeletingId(null);
    }
  };

  const studentsInGrade = (grade) =>
    students.filter(
      (s) => s.grade === grade || s.classSec === grade || s.classSec?.startsWith(grade)
    );

  const alreadyInvoicedCount = (structure) => {
    const gradeStudentIds = new Set(studentsInGrade(structure.grade).map((s) => s.id));
    const normTerm = (structure.term || '').trim().toLowerCase();
    const normType = (structure.feeType || '').trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchStudent = inv.studentId ? gradeStudentIds.has(inv.studentId) : false;
      const matchTerm = (inv.term || '').trim().toLowerCase() === normTerm;
      const matchType = (inv.feeType || '').trim().toLowerCase() === normType;
      return matchStudent && matchTerm && matchType;
    }).length;
  };

  const handleGenerate = async (structure) => {
    setGeneratingId(structure.id);
    try {
      const result = await onGenerateInvoices(structure);
      setResultById((prev) => ({ ...prev, [structure.id]: result }));
    } finally {
      setGeneratingId(null);
      setConfirmingId(null);
    }
  };

  return (
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-md" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        class="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-3xl p-lg animate-fadeIn max-h-[90vh] overflow-y-auto"
      >
        <div class="flex items-start justify-between mb-md">
          <div>
            <h3 class="font-headline-sm text-on-surface">Class Fee Structure</h3>
            <p class="text-label-sm text-on-surface-variant">
              Set a standard fee per class and term, then generate invoices for every student in that class in one click.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            class="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Add / edit fee structure form */}
        <form onSubmit={handleSubmit} class="bg-surface-container-high rounded-lg p-md mb-lg">
          {formError && (
            <div class="bg-error-container text-error text-label-sm px-md py-sm rounded-lg mb-sm">
              {formError}
            </div>
          )}
          <div class="grid grid-cols-1 sm:grid-cols-5 gap-sm items-end">
            <div class="sm:col-span-2">
              <label class="block font-label-sm text-on-surface-variant mb-xs">Term *</label>
              <input
                type="text"
                list="known-terms"
                value={form.term}
                onChange={(e) => setForm((p) => ({ ...p, term: e.target.value }))}
                placeholder="First Term 2025/2026"
                class="w-full border border-outline-variant rounded-lg px-sm py-1.5 text-body-md bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              />
              <datalist id="known-terms">
                {knownTerms.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div>
              <label class="block font-label-sm text-on-surface-variant mb-xs">Class *</label>
              <select
                value={form.grade}
                onChange={(e) => setForm((p) => ({ ...p, grade: e.target.value }))}
                class="w-full border border-outline-variant rounded-lg px-sm py-1.5 text-body-md bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label class="block font-label-sm text-on-surface-variant mb-xs">Fee Type *</label>
              <select
                value={form.feeType}
                onChange={(e) => setForm((p) => ({ ...p, feeType: e.target.value }))}
                class="w-full border border-outline-variant rounded-lg px-sm py-1.5 text-body-md bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              >
                {FEE_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label class="block font-label-sm text-on-surface-variant mb-xs">Amount *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                placeholder="450"
                class="w-full border border-outline-variant rounded-lg px-sm py-1.5 text-body-md bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div class="sm:col-span-2">
              <label class="block font-label-sm text-on-surface-variant mb-xs">Default Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                class="w-full border border-outline-variant rounded-lg px-sm py-1.5 text-body-md bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div class="sm:col-span-3 flex gap-sm">
              <button
                type="submit"
                disabled={saving}
                class="flex-1 bg-primary text-on-primary py-1.5 rounded-lg font-label-md hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Class Fee'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  class="flex-1 border border-outline-variant text-on-surface py-1.5 rounded-lg font-label-md"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Existing structures table */}
        {feeStructures.length === 0 ? (
          <div class="text-center text-on-surface-variant py-lg">
            No class fees set yet. Add one above — e.g. Grade 4, Tuition, $450 for First Term.
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container-low border-b border-outline-variant">
                  <th class="px-md py-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Term</th>
                  <th class="px-md py-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Class</th>
                  <th class="px-md py-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Fee Type</th>
                  <th class="px-md py-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Amount</th>
                  <th class="px-md py-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Students</th>
                  <th class="px-md py-sm font-label-sm text-label-sm text-on-surface-variant uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/30">
                {feeStructures.map((s) => {
                  const gradeCount = studentsInGrade(s.grade).length;
                  const invoicedCount = alreadyInvoicedCount(s);
                  const remaining = gradeCount - invoicedCount;
                  const result = resultById[s.id];
                  return (
                    <tr key={s.id} class="hover:bg-surface-container-low transition-colors align-top">
                      <td class="px-md py-sm font-body-md text-on-surface">{s.term}</td>
                      <td class="px-md py-sm font-body-md text-on-surface">{s.grade}</td>
                      <td class="px-md py-sm font-body-md text-on-surface-variant">{s.feeType}</td>
                      <td class="px-md py-sm font-body-md font-bold text-on-surface">{formatCurrency(s.amount)}</td>
                      <td class="px-md py-sm font-body-sm text-on-surface-variant">
                        {gradeCount} in class
                        {invoicedCount > 0 && <div class="text-[11px]">{invoicedCount} already invoiced</div>}
                      </td>
                      <td class="px-md py-sm">
                        <div class="flex items-center gap-xs flex-wrap">
                          {confirmingId === s.id ? (
                            <div class="flex items-center gap-xs">
                              <span class="text-[11px] text-on-surface-variant">
                                Create {remaining} invoice{remaining === 1 ? '' : 's'}?
                              </span>
                              <button
                                type="button"
                                onClick={() => handleGenerate(s)}
                                disabled={generatingId === s.id || remaining <= 0}
                                class="text-secondary hover:bg-secondary-container/10 p-1 rounded-lg border border-secondary/20 disabled:opacity-40"
                              >
                                <span class="material-symbols-outlined text-[16px]">
                                  {generatingId === s.id ? 'hourglass_empty' : 'check'}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingId(null)}
                                class="text-on-surface-variant hover:bg-surface-container-high p-1 rounded-lg"
                              >
                                <span class="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            </div>
                          ) : remaining <= 0 && gradeCount > 0 ? (
                            <span class="inline-flex items-center gap-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-sm py-1 rounded-lg font-label-md text-xs border border-emerald-200 dark:border-emerald-800">
                              <span class="material-symbols-outlined text-[16px]">check_circle</span>
                              Generated
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmingId(s.id)}
                              disabled={gradeCount <= 0}
                              title={gradeCount <= 0 ? 'No students found in this class' : 'Generate invoices for this class'}
                              class="flex items-center gap-xs text-secondary hover:bg-secondary-container/10 px-sm py-1 rounded-lg transition-colors font-label-md text-xs active:scale-95 border border-secondary/20 disabled:opacity-40"
                            >
                              <span class="material-symbols-outlined text-[16px]">group_add</span>
                              {invoicedCount > 0 ? `Generate (+${remaining})` : 'Generate'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleEdit(s)}
                            class="flex items-center gap-xs text-on-surface-variant hover:bg-surface-container-high px-sm py-1 rounded-lg transition-colors font-label-md text-xs active:scale-95"
                          >
                            <span class="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(s.id)}
                            disabled={deletingId === s.id}
                            class="flex items-center gap-xs text-error hover:bg-error-container/10 px-sm py-1 rounded-lg transition-colors font-label-md text-xs active:scale-95 disabled:opacity-40"
                          >
                            <span class="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                        {result && (
                          <p class="text-[11px] text-secondary mt-xs">
                            Created {result.created} invoice{result.created === 1 ? '' : 's'}
                            {result.skipped > 0 ? `, skipped ${result.skipped} already invoiced` : ''}.
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}