import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import StatusChip from '../components/ui/StatusChip';
import Avatar from '../components/ui/Avatar';
import ParentNoticeModal from '../components/ui/ParentNoticeModal';
import FormattedMarkdown from '../components/ui/FormattedMarkdown';
import { computeFeeTrend } from '../utils/feeTrend';
import { generateFinancialInsights } from '../lib/groq';

function formatCurrency(amount) {
  return `$${(amount || 0).toLocaleString()}`;
}

const STATUS_OPTIONS = ['Paid', 'Pending', 'Partially Paid', 'Overdue'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'POS', 'Debit/Credit Card', 'Cheque'];
const PAYMENT_METHOD_ICONS = {
  'Cash': 'payments',
  'Bank Transfer': 'account_balance',
  'POS': 'point_of_sale',
  'Debit/Credit Card': 'credit_card',
  'Cheque': 'receipt_long'
};
const FEE_TYPE_OPTIONS = [
  'Tuition', 'Development Levy', 'Exam Fee', 'Uniform', 'Books & Materials',
  'Transport', 'Boarding', 'PTA Levy', 'Other'
];

function computeStatus(amountDue, amountPaid) {
  const due = Number(amountDue) || 0;
  const paid = Number(amountPaid) || 0;
  if (paid <= 0) return 'Pending';
  if (paid < due) return 'Partially Paid';
  return 'Paid';
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

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
  remarks: ''
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
            studentName: data.studentName || 'Unknown Student',
            classSec: data.classSec || '',
            feeType: data.feeType || '',
            amount: typeof data.amount === 'number' ? data.amount : 0,
            amountPaid: typeof data.amountPaid === 'number' ? data.amountPaid : 0,
            paymentMethod: data.paymentMethod || '',
            paymentDate: data.paymentDate || '',
            receiptNo: data.receiptNo || '',
            remarks: data.remarks || '',
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
              classSec: [data.grade, data.section].filter(Boolean).join(' - ')
            };
          })
        );
      },
      (err) => console.error('Failed to load students for invoice form:', err)
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
      remarks: inv.remarks || ''
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
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-populate today's date the first time an amount paid is entered
      if (field === 'amountPaid' && Number(value) > 0 && !prev.paymentDate) {
        next.paymentDate = todayISO();
      }
      return next;
    });
  };

  const handleStudentPick = (studentId) => {
    const picked = students.find((s) => s.id === studentId);
    setForm((prev) => ({
      ...prev,
      studentId,
      studentName: picked ? picked.name : prev.studentName,
      classSec: picked ? picked.classSec : prev.classSec
    }));
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
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} class="hover:bg-surface-container-low transition-colors">
                    <td class="px-lg py-md">
                      <div class="flex items-center gap-md">
                        <Avatar initials={inv.studentName.substring(0, 2).toUpperCase()} alt={inv.studentName} />
                        <div>
                          <p class="font-body-md text-body-md text-on-surface font-semibold">{inv.studentName}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-lg py-md font-body-md text-on-surface-variant">{inv.feeType || '—'}</td>
                    <td class="px-lg py-md font-body-md text-on-surface">{inv.classSec}</td>
                    <td class="px-lg py-md font-body-md font-bold text-on-surface">{formatCurrency(inv.amount)}</td>
                    <td class="px-lg py-md">
                      {inv.amountPaid > 0 ? (
                        <div title={[inv.receiptNo && `Receipt: ${inv.receiptNo}`, inv.paymentDate && `Paid on ${inv.paymentDate}`, inv.remarks].filter(Boolean).join(' • ')}>
                          <p class="font-body-md text-on-surface">{formatCurrency(inv.amountPaid)}</p>
                          <div class="flex items-center gap-xs mt-0.5">
                            {inv.paymentMethod && (
                              <span class="text-[10px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant flex items-center gap-0.5">
                                <span class="material-symbols-outlined text-[12px]">
                                  {PAYMENT_METHOD_ICONS[inv.paymentMethod] || 'payments'}
                                </span>
                                {inv.paymentMethod}
                              </span>
                            )}
                            {inv.amountPaid < inv.amount && (
                              <span class="text-[11px] text-error">
                                {formatCurrency(inv.amount - inv.amountPaid)} owed
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span class="text-on-surface-variant text-body-sm">—</span>
                      )}
                    </td>
                    <td class="px-lg py-md font-body-md text-on-surface-variant">{inv.dueDate}</td>
                    <td class="px-lg py-md">
                      <StatusChip status={inv.status} />
                    </td>
                    <td class="px-lg py-md">
                      <div class="flex items-center gap-xs flex-wrap">
                        {inv.status !== 'Paid' && (
                          markingChoiceId === inv.id ? (
                            <div class="flex items-center gap-xs">
                              <select
                                autoFocus
                                value={pendingMethod}
                                onChange={(e) => setPendingMethod(e.target.value)}
                                class="border border-outline-variant rounded-lg px-xs py-1 text-xs bg-surface text-on-surface outline-none focus:ring-2 focus:ring-primary/30"
                              >
                                <option value="">Method…</option>
                                {PAYMENT_METHODS.map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => pendingMethod && handleMarkAsPaid(inv, pendingMethod)}
                                disabled={markingPaidId === inv.id || !pendingMethod}
                                title="Confirm full payment received"
                                class="flex items-center text-secondary hover:bg-secondary-container/10 p-1 rounded-lg border border-secondary/20 disabled:opacity-40"
                              >
                                <span class="material-symbols-outlined text-[16px]">
                                  {markingPaidId === inv.id ? 'hourglass_empty' : 'check'}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { setMarkingChoiceId(null); setPendingMethod(''); }}
                                title="Cancel"
                                class="text-on-surface-variant hover:bg-surface-container-high p-1 rounded-lg"
                              >
                                <span class="material-symbols-outlined text-[16px]">close</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setMarkingChoiceId(inv.id); setPendingMethod(''); }}
                              title="Record full payment received"
                              class="flex items-center gap-xs text-secondary hover:bg-secondary-container/10 px-sm py-1 rounded-lg transition-colors font-label-md text-xs active:scale-95 border border-secondary/20 disabled:opacity-50"
                            >
                              <span class="material-symbols-outlined text-[16px]">check_circle</span>
                              Mark Paid
                            </button>
                          )
                        )}
                        <button
                          onClick={() => openEditModal(inv)}
                          title="Edit invoice"
                          class="flex items-center gap-xs text-on-surface-variant hover:bg-surface-container-high px-sm py-1 rounded-lg transition-colors font-label-md text-xs active:scale-95"
                        >
                          <span class="material-symbols-outlined text-[16px]">edit</span>
                          Edit
                        </button>
                        <button
                          onClick={() => openNoticeModal(inv)}
                          title="Generate Smart AI Parent Notice"
                          class="flex items-center gap-xs text-primary hover:bg-primary-fixed px-sm py-1 rounded-lg transition-colors font-label-md text-xs active:scale-95 border border-primary/20"
                        >
                          <span class="material-symbols-outlined text-[16px]">auto_awesome</span>
                          AI Notice
                        </button>
                        {inv.status !== 'Paid' && (
                          <button
                            onClick={() => handleSendReminder(inv.id)}
                            title="Send Quick Reminder"
                            class="flex items-center gap-xs text-on-surface-variant hover:bg-surface-container-high px-sm py-1 rounded-lg transition-colors font-label-md text-xs active:scale-95"
                          >
                            <span class="material-symbols-outlined text-[16px]">send</span>
                            Reminder
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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