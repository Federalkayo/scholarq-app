import React, { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import StatusChip from '../components/ui/StatusChip';
import Avatar from '../components/ui/Avatar';
import ParentNoticeModal from '../components/ui/ParentNoticeModal';
import ClassFeeStructureModal from '../components/ui/ClassFeeStructureModal';
import StudentFeeBreakdownModal from '../components/ui/StudentFeeBreakdownModal';
import FormattedMarkdown from '../components/ui/FormattedMarkdown';
import { computeFeeTrend } from '../utils/feeTrend';
import { generateFinancialInsights } from '../lib/groq';
import {
  STATUS_OPTIONS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_ICONS,
  FEE_TYPE_OPTIONS,
  computeStatus,
  todayISO,
  formatCurrency
} from '../constants/fees';

const emptyForm = {
  id: null,
  studentId: '',
  studentName: '',
  classSec: '',
  feeType: FEE_TYPE_OPTIONS[0],
  amount: '',
  dueDate: '',
  amountPaid: '',
  paymentMethod: '',
  paymentDate: '',
  receiptNo: '',
  remarks: '',
  term: ''
};

export default function Fees() {
  const { searchQuery } = useOutletContext();
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sentReminderId, setSentReminderId] = useState(null);
  const [animateBars, setAnimateBars] = useState(false);

  // Add / Edit invoice modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Mark-as-paid inline loading state
  const [markingPaidId, setMarkingPaidId] = useState(null);
  const [markingChoiceId, setMarkingChoiceId] = useState(null);
  const [pendingMethod, setPendingMethod] = useState('');

  // Filter panel state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterClass, setFilterClass] = useState('All');

  // AI Financial Insights state
  const [financialInsights, setFinancialInsights] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState('');

  // Parent Notice Modal state
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [selectedInvoiceForNotice, setSelectedInvoiceForNotice] = useState(null);

  // Class Fee Structure state
  const [feeStructures, setFeeStructures] = useState([]);
  const [showClassFeesModal, setShowClassFeesModal] = useState(false);

  // Selected student group for dialog breakdown modal
  const [selectedStudentGroup, setSelectedStudentGroup] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateBars(true), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'fees'),
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            studentId: data.studentId || '',
            studentName: data.studentName || 'Unknown Student',
            classSec: data.classSec || '',
            feeType: data.feeType || '',
            amount: typeof data.amount === 'number' ? data.amount : 0,
            amountPaid: typeof data.amountPaid === 'number' ? data.amountPaid : 0,
            paymentMethod: data.paymentMethod || '',
            paymentDate: data.paymentDate || '',
            receiptNo: data.receiptNo || '',
            remarks: data.remarks || '',
            term: data.term || '',
            dueDate: data.dueDate || '',
            status: data.status || 'Pending'
          };
        });
        setInvoices(list);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load fee invoices:', err);
        setError('Could not load fee data. Please try again.');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'students'),
      (snapshot) => {
        setStudents(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: data.name || 'Unnamed Student',
              classSec: [data.grade, data.section].filter(Boolean).join(' - '),
              grade: data.grade || '',
              avatar: data.avatar || ''
            };
          })
        );
      },
      (err) => console.error('Failed to load students for invoice form:', err)
    );
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'feeStructures'),
      (snapshot) => {
        setFeeStructures(
          snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              term: data.term || '',
              grade: data.grade || '',
              feeType: data.feeType || '',
              amount: typeof data.amount === 'number' ? data.amount : 0,
              dueDate: data.dueDate || ''
            };
          })
        );
      },
      (err) => console.error('Failed to load class fee structures:', err)
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

  const classOptions = Array.from(new Set(invoices.map((inv) => inv.classSec).filter(Boolean))).sort();

  const filteredInvoices = invoices.filter((inv) => {
    if (filterStatus !== 'All' && inv.status !== filterStatus) return false;
    if (filterClass !== 'All' && inv.classSec !== filterClass) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.studentName.toLowerCase().includes(q) ||
      inv.classSec.toLowerCase().includes(q) ||
      inv.id.toLowerCase().includes(q)
    );
  });

  const activeFilterCount = (filterStatus !== 'All' ? 1 : 0) + (filterClass !== 'All' ? 1 : 0);

  // Resolve a student's current profile photo for an invoice: prefer the linked
  // studentId, but fall back to a name match for legacy invoices saved before
  // invoices carried a studentId (e.g. seeded data or manually-typed entries).
  const getStudentAvatar = (inv) => {
    const byId = inv.studentId && students.find((s) => s.id === inv.studentId);
    if (byId?.avatar) return byId.avatar;
    const byName = students.find(
      (s) => s.name.trim().toLowerCase() === (inv.studentName || '').trim().toLowerCase()
    );
    return byName?.avatar || '';
  };

  const toggleStudentExpand = (key) => {
    setExpandedStudentKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const groupedStudentInvoices = useMemo(() => {
    const map = new Map();
    filteredInvoices.forEach((inv) => {
      const key = inv.studentId || `${inv.studentName}_${inv.classSec}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          studentId: inv.studentId,
          studentName: inv.studentName,
          classSec: inv.classSec,
          avatar: getStudentAvatar(inv),
          invoices: []
        });
      }
      map.get(key).invoices.push(inv);
    });

    return Array.from(map.values()).map((group) => {
      const totalAmount = group.invoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      const totalPaid = group.invoices.reduce((sum, i) => sum + (Number(i.amountPaid) || 0), 0);
      const hasOverdue = group.invoices.some((i) => i.status === 'Overdue');
      const allPaid = group.invoices.every((i) => i.status === 'Paid');
      const hasPaid = totalPaid > 0;

      let overallStatus = 'Pending';
      if (allPaid) overallStatus = 'Paid';
      else if (hasOverdue) overallStatus = 'Overdue';
      else if (hasPaid) overallStatus = 'Partially Paid';

      const feeTypesList = Array.from(
        new Set(group.invoices.map((i) => i.feeType).filter(Boolean))
      ).join(', ');

      const dueDates = group.invoices.map((i) => i.dueDate).filter(Boolean).sort();
      const primaryDueDate = dueDates[0] || '—';

      return {
        ...group,
        totalAmount,
        totalPaid,
        overallStatus,
        feeTypesList,
        primaryDueDate
      };
    });
  }, [filteredInvoices, students]);

  const activeSelectedStudentGroup = useMemo(() => {
    if (!selectedStudentGroup) return null;
    return (
      groupedStudentInvoices.find((g) => g.key === selectedStudentGroup.key) || selectedStudentGroup
    );
  }, [selectedStudentGroup, groupedStudentInvoices]);

  const totalOutstanding = invoices
    .filter((inv) => inv.status === 'Overdue' || inv.status === 'Pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalCollected = invoices
    .filter((inv) => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  // Real monthly trend, computed from each invoice's dueDate/amount/status.
  const feeTrendData = computeFeeTrend(invoices, 5);
  const hasAnyTrendData = feeTrendData.some((d) => d.hasData);

  const handleSendReminder = (id) => {
    setSentReminderId(id);
    setTimeout(() => setSentReminderId(null), 3000);
  };

  const openAddModal = () => {
    setForm(emptyForm);
    setModalMode('add');
    setSaveError('');
    setShowModal(true);
  };

  const openEditModal = (inv) => {
    setForm({
      id: inv.id,
      studentId: inv.studentId || '',
      studentName: inv.studentName,
      classSec: inv.classSec,
      feeType: inv.feeType || FEE_TYPE_OPTIONS[0],
      amount: inv.amount,
      dueDate: inv.dueDate,
      amountPaid: inv.amountPaid || '',
      paymentMethod: inv.paymentMethod || '',
      paymentDate: inv.paymentDate || '',
      receiptNo: inv.receiptNo || '',
      remarks: inv.remarks || '',
      term: inv.term || ''
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

  const findFeeStructureMatch = (grade, feeType) => {
    const matches = feeStructures.filter((s) => s.grade === grade && s.feeType === feeType);
    if (matches.length === 0) return null;
    // Prefer the most recently due structure if several terms defined the same class/fee type
    return matches.slice().sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''))[0];
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-populate today's date the first time an amount paid is entered
      if (field === 'amountPaid' && Number(value) > 0 && !prev.paymentDate) {
        next.paymentDate = todayISO();
      }
      // Auto-fill amount from the class fee structure once fee type is known,
      // but never override an amount the bursar has already typed in
      if (field === 'feeType' && !prev.amount) {
        const picked = students.find((s) => s.id === prev.studentId);
        const match = picked && findFeeStructureMatch(picked.grade, value);
        if (match) {
          next.amount = match.amount;
          next.term = match.term;
          if (!prev.dueDate && match.dueDate) next.dueDate = match.dueDate;
        }
      }
      return next;
    });
  };

  const handleStudentPick = (studentId) => {
    const picked = students.find((s) => s.id === studentId);
    setForm((prev) => {
      const next = {
        ...prev,
        studentId,
        studentName: picked ? picked.name : prev.studentName,
        classSec: picked ? picked.classSec : prev.classSec
      };
      if (picked && !prev.amount) {
        const match = findFeeStructureMatch(picked.grade, prev.feeType);
        if (match) {
          next.amount = match.amount;
          next.term = match.term;
          if (!prev.dueDate && match.dueDate) next.dueDate = match.dueDate;
        }
      }
      return next;
    });
  };

  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    if (!form.studentName.trim()) {
      setSaveError('Student name is required.');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setSaveError('Enter a valid amount due.');
      return;
    }
    if (!form.dueDate) {
      setSaveError('Due date is required.');
      return;
    }
    const amountDueNum = Number(form.amount);
    const amountPaidNum = form.amountPaid === '' ? 0 : Number(form.amountPaid);
    if (amountPaidNum < 0) {
      setSaveError('Amount paid cannot be negative.');
      return;
    }
    if (amountPaidNum > amountDueNum) {
      setSaveError('Amount paid cannot exceed the amount due.');
      return;
    }
    if (amountPaidNum > 0 && !form.paymentMethod) {
      setSaveError('Select a payment method for the amount paid.');
      return;
    }
    if (amountPaidNum > 0 && !form.paymentDate) {
      setSaveError('Payment date is required for the amount paid.');
      return;
    }
    setSaving(true);
    setSaveError('');

    const payload = {
      studentId: form.studentId || '',
      studentName: form.studentName.trim(),
      classSec: form.classSec.trim(),
      feeType: form.feeType,
      amount: amountDueNum,
      dueDate: form.dueDate,
      amountPaid: amountPaidNum,
      paymentMethod: amountPaidNum > 0 ? form.paymentMethod : '',
      paymentDate: amountPaidNum > 0 ? form.paymentDate : '',
      receiptNo: amountPaidNum > 0 ? form.receiptNo.trim() : '',
      remarks: amountPaidNum > 0 ? form.remarks.trim() : '',
      term: form.term.trim(),
      status: computeStatus(amountDueNum, amountPaidNum)
    };

    try {
      if (modalMode === 'add') {
        await addDoc(collection(db, 'fees'), payload);
      } else {
        await updateDoc(doc(db, 'fees', form.id), payload);
      }
      closeModal();
    } catch (err) {
      console.error('Failed to save invoice:', err);
      setSaveError('Could not save invoice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAsPaid = async (inv, paymentMethod) => {
    if (inv.status === 'Paid') return;
    setMarkingPaidId(inv.id);
    try {
      await updateDoc(doc(db, 'fees', inv.id), {
        status: 'Paid',
        amountPaid: inv.amount,
        paymentMethod,
        paymentDate: todayISO()
      });
    } catch (err) {
      console.error('Failed to mark invoice as paid:', err);
    } finally {
      setMarkingPaidId(null);
      setMarkingChoiceId(null);
    }
  };

  const handleSaveFeeStructure = async (structure) => {
    const payload = {
      term: structure.term,
      grade: structure.grade,
      feeType: structure.feeType,
      amount: structure.amount,
      dueDate: structure.dueDate || ''
    };
    if (structure.id) {
      await updateDoc(doc(db, 'feeStructures', structure.id), payload);
    } else {
      await addDoc(collection(db, 'feeStructures'), payload);
    }
  };

  const handleDeleteFeeStructure = async (id) => {
    await deleteDoc(doc(db, 'feeStructures', id));
  };

  const handleGenerateInvoicesForStructure = async (structure) => {
    const classStudents = students.filter(
      (s) => s.grade === structure.grade || s.classSec === structure.grade || s.classSec?.startsWith(structure.grade)
    );
    const normTerm = (structure.term || '').trim().toLowerCase();
    const normType = (structure.feeType || '').trim().toLowerCase();
    const alreadyInvoiced = new Set(
      invoices
        .filter(
          (inv) =>
            (inv.feeType || '').trim().toLowerCase() === normType &&
            (inv.term || '').trim().toLowerCase() === normTerm
        )
        .map((inv) => inv.studentId)
        .filter(Boolean)
    );
    const targets = classStudents.filter((s) => !alreadyInvoiced.has(s.id));

    await Promise.all(
      targets.map((s) =>
        addDoc(collection(db, 'fees'), {
          studentId: s.id,
          studentName: s.name,
          classSec: s.classSec,
          feeType: structure.feeType,
          amount: structure.amount,
          dueDate: structure.dueDate || '',
          amountPaid: 0,
          paymentMethod: '',
          paymentDate: '',
          receiptNo: '',
          remarks: '',
          term: structure.term,
          status: computeStatus(structure.amount, 0)
        })
      )
    );

    return { created: targets.length, skipped: classStudents.length - targets.length };
  };

  const handleGenerateInsights = async () => {
    if (invoices.length === 0) return;
    setInsightsLoading(true);
    setInsightsError('');
    try {
      const res = await generateFinancialInsights(invoices);
      setFinancialInsights(res);
    } catch (err) {
      console.error('Failed to generate financial insights:', err);
      setInsightsError(err.message || 'Failed to generate financial insights.');
    } finally {
      setInsightsLoading(false);
    }
  };

  const openNoticeModal = (inv = null) => {
    setSelectedInvoiceForNotice(inv);
    setNoticeModalOpen(true);
  };

  return (
    <div class="p-xl max-w-container-max mx-auto animate-fadeIn">
      {sentReminderId && (
        <div class="fixed bottom-6 right-6 bg-primary text-on-primary px-lg py-md rounded-lg shadow-xl z-50 flex items-center gap-md animate-fadeIn">
          <span class="material-symbols-outlined text-secondary-fixed">check_circle</span>
          <span class="font-label-md">Payment reminder successfully sent!</span>
        </div>
      )}

      <ParentNoticeModal
        isOpen={noticeModalOpen}
        onClose={() => setNoticeModalOpen(false)}
        initialData={selectedInvoiceForNotice || {}}
      />

      <ClassFeeStructureModal
        isOpen={showClassFeesModal}
        onClose={() => setShowClassFeesModal(false)}
        feeStructures={feeStructures}
        students={students}
        invoices={invoices}
        onSaveStructure={handleSaveFeeStructure}
        onDeleteStructure={handleDeleteFeeStructure}
        onGenerateInvoices={handleGenerateInvoicesForStructure}
      />

      <StudentFeeBreakdownModal
        isOpen={Boolean(selectedStudentGroup)}
        onClose={() => setSelectedStudentGroup(null)}
        group={activeSelectedStudentGroup}
        onMarkAsPaid={handleMarkAsPaid}
        onEditInvoice={openEditModal}
        onOpenNoticeModal={openNoticeModal}
        onSendReminder={handleSendReminder}
        markingPaidId={markingPaidId}
      />

      <div class="flex flex-wrap justify-between items-end mb-lg gap-md">
        <div>
          <h2 class="font-display-lg text-display-lg text-primary">Fee Management</h2>
          <p class="text-on-surface-variant font-body-md">
            Monitor, forecast, and collect tuition fees.
          </p>
        </div>
        <div class="flex flex-wrap gap-sm items-start relative">
          <button
            onClick={openAddModal}
            class="bg-primary text-on-primary font-label-md px-md py-sm rounded-lg flex items-center gap-xs hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <span class="material-symbols-outlined text-[18px]">add</span>
            Add Invoice
          </button>
          <button
            onClick={() => setShowClassFeesModal(true)}
            class="bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md px-md py-sm rounded-lg flex items-center gap-xs hover:bg-surface-container-high transition-all"
          >
            <span class="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            Class Fees
          </button>
          <div class="relative">
            <button
              onClick={() => setShowFilterPanel((v) => !v)}
              class="bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md px-md py-sm rounded-lg flex items-center gap-xs hover:bg-surface-container-high transition-all"
            >
              <span class="material-symbols-outlined text-[18px]">filter_list</span>
              Filter
              {activeFilterCount > 0 && (
                <span class="bg-primary text-on-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {showFilterPanel && (
              <div class="absolute right-0 mt-xs w-64 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-xl z-30 p-md animate-fadeIn">
                <div class="mb-md">
                  <label class="block font-label-sm text-on-surface-variant uppercase mb-xs">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    class="w-full border border-outline-variant rounded-lg px-sm py-1.5 text-body-md bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="All">All statuses</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div class="mb-md">
                  <label class="block font-label-sm text-on-surface-variant uppercase mb-xs">Class</label>
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    class="w-full border border-outline-variant rounded-lg px-sm py-1.5 text-body-md bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="All">All classes</option>
                    {classOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => { setFilterStatus('All'); setFilterClass('All'); }}
                  class="w-full text-center text-label-md text-primary hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => openNoticeModal(null)}
            class="bg-primary/10 border border-primary/20 text-primary font-label-md px-md py-sm rounded-lg flex items-center gap-xs hover:bg-primary/20 transition-all"
          >
            <span class="material-symbols-outlined text-[18px]">auto_awesome</span>
            AI Parent Notice
          </button>
          <button
            onClick={() => handleSendReminder('ALL')}
            class="bg-secondary text-on-secondary font-label-md px-md py-sm rounded-lg flex items-center gap-xs hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <span class="material-symbols-outlined">send</span>
            Send Reminder
          </button>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-lg mb-lg">
        <div class="col-span-12 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div class="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm hover-lift">
            <p class="text-label-sm text-on-surface-variant uppercase mb-xs font-bold">Total Outstanding</p>
            <h3 class="text-headline-md font-display-lg text-primary">{formatCurrency(totalOutstanding)}</h3>
          </div>
          <div class="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm hover-lift">
            <p class="text-label-sm text-on-surface-variant uppercase mb-xs font-bold">Collected</p>
            <h3 class="text-headline-md font-display-lg text-secondary">{formatCurrency(totalCollected)}</h3>
          </div>
        </div>

        <div class="col-span-12 lg:col-span-8 bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm hover-lift">
          <div class="flex justify-between items-center mb-md">
            <h4 class="font-headline-sm text-on-surface">Fee Collection Trend</h4>
            <div class="flex gap-md text-[12px]">
              <span class="flex items-center gap-xs">
                <span class="w-3 h-3 rounded-full bg-primary"></span> Expected
              </span>
              <span class="flex items-center gap-xs">
                <span class="w-3 h-3 rounded-full bg-secondary"></span> Collected
              </span>
            </div>
          </div>
          {!hasAnyTrendData ? (
            <p class="text-on-surface-variant text-body-md py-lg text-center">
              No invoices with due dates in the last 5 months yet.
            </p>
          ) : (
            <div class="h-40 relative flex items-end justify-between gap-4 group border-b border-outline-variant px-4 pt-4">
              {feeTrendData.map((d) => (
                <div
                  key={d.month}
                  class={`flex-1 flex flex-col items-center gap-sm h-full justify-end relative group/bar ${!d.hasData ? 'opacity-40' : ''}`}
                >
                  <div class="absolute -top-8 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-primary text-on-primary text-xs px-2 py-1 rounded shadow-md pointer-events-none z-20 whitespace-nowrap">
                    {d.hasData ? d.amount : 'No data'}
                  </div>
                  <div class="w-full max-w-[48px] bg-primary/20 rounded-t-md relative h-full flex items-end overflow-hidden">
                    <div
                      class="w-full bg-primary rounded-t-md transition-all duration-1000 ease-out absolute bottom-0"
                      style={{ height: animateBars ? d.expectedHeight : '0%' }}
                    >
                      <div
                        class="w-full bg-secondary rounded-t-md transition-all duration-1000 ease-out absolute bottom-0"
                        style={{ height: animateBars ? d.collectedHeight : '0%' }}
                      ></div>
                    </div>
                  </div>
                  <span class="text-xs text-on-surface-variant font-bold">{d.month}</span>
                </div>
              ))}
            </div>
          )}
          <p class="text-[11px] text-on-surface-variant mt-sm italic">
            Live trend from invoice due dates and payment status.
          </p>
        </div>
      </div>

      {/* AI Financial Forecast & Recovery Insights */}
      <div class="bg-gradient-to-r from-surface-container-lowest to-primary-fixed/20 rounded-xl border border-primary/20 shadow-sm p-lg mb-lg">
        <div class="flex flex-wrap justify-between items-center mb-md gap-md">
          <div class="flex items-center gap-md">
            <div class="p-2 bg-primary/10 rounded-lg text-primary">
              <span class="material-symbols-outlined text-[24px]">trending_up</span>
            </div>
            <div>
              <h4 class="font-headline-sm text-on-surface font-bold">AI Financial Collection Forecast & Recovery Insights</h4>
              <p class="text-xs text-on-surface-variant">Real-time analytical revenue forecasting powered by Groq Llama-3.3</p>
            </div>
          </div>
          <button
            onClick={handleGenerateInsights}
            disabled={insightsLoading}
            class="bg-primary text-on-primary font-label-md px-md py-sm rounded-lg flex items-center gap-xs hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            {insightsLoading ? (
              <>
                <span class="w-4 h-4 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin"></span>
                Analyzing Financial Data…
              </>
            ) : (
              <>
                <span class="material-symbols-outlined text-[18px]">auto_awesome</span>
                {financialInsights ? 'Refresh Forecast' : 'Generate AI Forecast'}
              </>
            )}
          </button>
        </div>

        {insightsError && (
          <div class="bg-error-container text-error text-label-md p-md rounded-lg mb-sm">
            {insightsError}
          </div>
        )}

        {financialInsights ? (
          <div class="bg-surface-container-lowest p-md rounded-lg border border-outline-variant/40 animate-fadeIn">
            <FormattedMarkdown content={financialInsights} />
          </div>
        ) : (
          <div class="bg-surface/50 border border-dashed border-outline-variant rounded-lg p-md text-center text-on-surface-variant text-body-md">
            Click <strong class="text-primary font-semibold">"Generate AI Forecast"</strong> to produce an executive cash flow analysis, identify recovery vulnerabilities, and receive 3 custom bursar action recommendations.
          </div>
        )}
      </div>

      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <div class="p-xl text-center text-on-surface-variant">Loading invoices…</div>
        ) : error ? (
          <div class="p-xl text-center text-error">{error}</div>
        ) : filteredInvoices.length === 0 ? (
          <div class="p-xl text-center text-on-surface-variant">
            {searchQuery ? 'No invoices match your search.' : 'No fee invoices yet.'}
          </div>
        ) : (
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container-low border-b border-outline-variant">
                  <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Student</th>
                  <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Fee Type</th>
                  <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Class</th>
                  <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Amount Due</th>
                  <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Paid</th>
                  <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Due Date</th>
                  <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Status</th>
                  <th class="px-lg py-md font-label-sm text-label-sm text-on-surface-variant uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/30">
                {groupedStudentInvoices.map((group) => {
                  const invoiceCount = group.invoices.length;
                  return (
                    <tr
                      key={group.key}
                      onClick={() => setSelectedStudentGroup(group)}
                      class="hover:bg-surface-container-low transition-colors cursor-pointer select-none group"
                    >
                      <td class="px-lg py-md">
                        <div class="flex items-center gap-md">
                          <Avatar
                            src={group.avatar}
                            initials={group.studentName.substring(0, 2).toUpperCase()}
                            alt={group.studentName}
                          />
                          <div>
                            <div class="flex items-center gap-xs">
                              <p class="font-body-md text-body-md text-on-surface font-bold group-hover:text-primary transition-colors">
                                {group.studentName}
                              </p>
                              <span class="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                                {invoiceCount} {invoiceCount === 1 ? 'fee' : 'fees'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-lg py-md font-body-md text-on-surface-variant font-medium">
                        {group.feeTypesList || '—'}
                      </td>
                      <td class="px-lg py-md font-body-md text-on-surface">{group.classSec}</td>
                      <td class="px-lg py-md font-body-md font-bold text-on-surface">
                        {formatCurrency(group.totalAmount)}
                      </td>
                      <td class="px-lg py-md">
                        {group.totalPaid > 0 ? (
                          <div>
                            <p class="font-body-md font-bold text-on-surface">{formatCurrency(group.totalPaid)}</p>
                            {group.totalPaid < group.totalAmount && (
                              <p class="text-[11px] text-error font-medium">
                                {formatCurrency(group.totalAmount - group.totalPaid)} owed
                              </p>
                            )}
                          </div>
                        ) : (
                          <span class="text-on-surface-variant text-body-sm">—</span>
                        )}
                      </td>
                      <td class="px-lg py-md font-body-md text-on-surface-variant">{group.primaryDueDate}</td>
                      <td class="px-lg py-md">
                        <StatusChip status={group.overallStatus} />
                      </td>
                      <td class="px-lg py-md">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudentGroup(group);
                          }}
                          class="text-xs text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-md py-1.5 rounded-lg font-label-md flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
                        >
                          <span class="material-symbols-outlined text-[16px]">visibility</span>
                          View Breakdown
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-md" onClick={closeModal}>
          <form
            onSubmit={handleSaveInvoice}
            onClick={(e) => e.stopPropagation()}
            class="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-lg p-lg animate-fadeIn max-h-[90vh] overflow-y-auto"
          >
            <div class="flex items-start justify-between mb-md">
              <div>
                <h3 class="font-headline-sm text-on-surface">
                  {modalMode === 'add' ? 'Add Fee Invoice' : 'Edit Fee Invoice'}
                </h3>
                <p class="text-label-sm text-on-surface-variant">
                  {modalMode === 'add' ? 'Creates a new invoice record.' : "Updates this invoice's details."}
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
                <label class="block font-label-md text-on-surface-variant mb-xs">Student *</label>
                <select
                  value={form.studentId}
                  onChange={(e) => handleStudentPick(e.target.value)}
                  class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                >
                  <option value="">Custom / not in Students list</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div class="sm:col-span-2">
                <label class="block font-label-md text-on-surface-variant mb-xs">Student Name *</label>
                <input
                  type="text"
                  value={form.studentName}
                  onChange={(e) => handleFormChange('studentName', e.target.value)}
                  required
                  autoFocus
                  placeholder="e.g. Julian Thorne"
                  class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                />
              </div>

              <div>
                <label class="block font-label-md text-on-surface-variant mb-xs">Fee Type *</label>
                <select
                  value={form.feeType}
                  onChange={(e) => handleFormChange('feeType', e.target.value)}
                  class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                >
                  {FEE_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label class="block font-label-md text-on-surface-variant mb-xs">Class / Section</label>
                <input
                  type="text"
                  value={form.classSec}
                  onChange={(e) => handleFormChange('classSec', e.target.value)}
                  placeholder="e.g. Grade 10 - Section A"
                  class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                />
              </div>

              <div>
                <label class="block font-label-md text-on-surface-variant mb-xs">Term (optional)</label>
                <input
                  type="text"
                  list="fees-known-terms"
                  value={form.term}
                  onChange={(e) => handleFormChange('term', e.target.value)}
                  placeholder="First Term 2025/2026"
                  class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                />
                <datalist id="fees-known-terms">
                  {Array.from(new Set(feeStructures.map((s) => s.term).filter(Boolean))).map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>

              <div>
                <label class="block font-label-md text-on-surface-variant mb-xs">Amount Due *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                  placeholder="450"
                  class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                />
              </div>

              <div>
                <label class="block font-label-md text-on-surface-variant mb-xs">Due Date *</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => handleFormChange('dueDate', e.target.value)}
                  class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                />
              </div>

              <div class="sm:col-span-2 border-t border-outline-variant pt-md mt-xs">
                <label class="block font-label-md text-on-surface-variant mb-xs">Amount Paid (optional)</label>
                <input
                  type="number"
                  min="0"
                  max={form.amount || undefined}
                  step="0.01"
                  value={form.amountPaid}
                  onChange={(e) => handleFormChange('amountPaid', e.target.value)}
                  placeholder="Leave blank if nothing has been paid yet"
                  class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                />
              </div>

              {/* Read-only outstanding balance + auto-computed status, so the bursar sees the effect immediately */}
              <div class="sm:col-span-2 bg-surface-container-high rounded-lg p-md grid grid-cols-3 gap-sm text-center">
                <div>
                  <p class="text-[11px] uppercase tracking-wide text-on-surface-variant">Amount Due</p>
                  <p class="font-body-md font-bold text-on-surface">{formatCurrency(Number(form.amount) || 0)}</p>
                </div>
                <div>
                  <p class="text-[11px] uppercase tracking-wide text-on-surface-variant">Amount Paid</p>
                  <p class="font-body-md font-bold text-on-surface">{formatCurrency(Number(form.amountPaid) || 0)}</p>
                </div>
                <div>
                  <p class="text-[11px] uppercase tracking-wide text-on-surface-variant">Outstanding</p>
                  <p class="font-body-md font-bold text-error">
                    {formatCurrency(Math.max((Number(form.amount) || 0) - (Number(form.amountPaid) || 0), 0))}
                  </p>
                </div>
                <div class="col-span-3 pt-xs mt-xs border-t border-outline-variant/50 flex items-center justify-center gap-xs">
                  <span class="text-[11px] uppercase tracking-wide text-on-surface-variant">Status (auto):</span>
                  <StatusChip status={computeStatus(form.amount, form.amountPaid)} />
                </div>
              </div>

              {Number(form.amountPaid) > 0 && (
                <div class="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-md bg-primary/5 border border-primary/10 rounded-lg p-md">
                  <div class="sm:col-span-2">
                    <h4 class="font-label-md text-on-surface flex items-center gap-xs">
                      <span class="material-symbols-outlined text-[18px] text-primary">receipt_long</span>
                      Payment Details
                    </h4>
                  </div>
                  <div>
                    <label class="block font-label-md text-on-surface-variant mb-xs">Payment Method *</label>
                    <select
                      value={form.paymentMethod}
                      onChange={(e) => handleFormChange('paymentMethod', e.target.value)}
                      class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                    >
                      <option value="">Select method…</option>
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label class="block font-label-md text-on-surface-variant mb-xs">Payment Date *</label>
                    <input
                      type="date"
                      value={form.paymentDate}
                      onChange={(e) => handleFormChange('paymentDate', e.target.value)}
                      class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                    />
                  </div>
                  <div>
                    <label class="block font-label-md text-on-surface-variant mb-xs">Receipt No. (optional)</label>
                    <input
                      type="text"
                      value={form.receiptNo}
                      onChange={(e) => handleFormChange('receiptNo', e.target.value)}
                      placeholder="RCPT-2026-00145"
                      class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                    />
                  </div>
                  <div>
                    <label class="block font-label-md text-on-surface-variant mb-xs">Remarks (optional)</label>
                    <input
                      type="text"
                      value={form.remarks}
                      onChange={(e) => handleFormChange('remarks', e.target.value)}
                      placeholder="Paid at the school office"
                      class="w-full border border-outline-variant rounded-lg px-md py-2 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-surface text-on-surface"
                    />
                  </div>
                </div>
              )}
            </div>

            <div class="flex gap-md mt-xl">
              <button
                type="submit"
                disabled={saving}
                class="flex-1 bg-primary text-on-primary py-sm rounded-lg font-label-md hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving…' : modalMode === 'add' ? 'Add Invoice' : 'Save Changes'}
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