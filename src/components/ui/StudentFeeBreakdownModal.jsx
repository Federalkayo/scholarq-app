import React, { useState } from 'react';
import StatusChip from './StatusChip';
import Avatar from './Avatar';
import { formatCurrency, PAYMENT_METHODS } from '../../constants/fees';

export default function StudentFeeBreakdownModal({
  isOpen,
  onClose,
  group,
  onMarkAsPaid,
  onEditInvoice,
  onOpenNoticeModal,
  onSendReminder,
  markingPaidId
}) {
  const [markingChoiceId, setMarkingChoiceId] = useState(null);
  const [pendingMethod, setPendingMethod] = useState('');

  if (!isOpen || !group) return null;

  const remainingOwed = Math.max(0, group.totalAmount - group.totalPaid);

  return (
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        class="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-3xl border border-outline-variant/60 flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div class="p-lg bg-surface-container-low border-b border-outline-variant/40 flex items-start justify-between">
          <div class="flex items-center gap-md">
            <Avatar
              src={group.avatar}
              initials={group.studentName.substring(0, 2).toUpperCase()}
              alt={group.studentName}
              size="lg"
            />
            <div>
              <div class="flex items-center gap-sm">
                <h3 class="font-headline-sm text-on-surface font-bold">{group.studentName}</h3>
                <span class="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full border border-primary/20">
                  {group.classSec}
                </span>
              </div>
              <p class="text-xs text-on-surface-variant mt-0.5">
                {group.invoices.length} Fee {group.invoices.length === 1 ? 'Item' : 'Items'} Listed
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            class="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Financial Summary Card Bar */}
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-md p-md bg-surface-container-lowest border-b border-outline-variant/30 text-center">
          <div class="p-sm bg-surface-container-low rounded-xl border border-outline-variant/30">
            <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Total Summed</p>
            <p class="text-headline-xs font-bold text-on-surface mt-0.5">{formatCurrency(group.totalAmount)}</p>
          </div>
          <div class="p-sm bg-surface-container-low rounded-xl border border-outline-variant/30">
            <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Total Paid</p>
            <p class="text-headline-xs font-bold text-secondary mt-0.5">{formatCurrency(group.totalPaid)}</p>
          </div>
          <div class="p-sm bg-surface-container-low rounded-xl border border-outline-variant/30">
            <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Balance Owed</p>
            <p class={`text-headline-xs font-bold mt-0.5 ${remainingOwed > 0 ? 'text-error' : 'text-on-surface-variant'}`}>
              {formatCurrency(remainingOwed)}
            </p>
          </div>
          <div class="p-sm bg-surface-container-low rounded-xl border border-outline-variant/30 flex flex-col items-center justify-center">
            <p class="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Status</p>
            <StatusChip status={group.overallStatus} />
          </div>
        </div>

        {/* Invoices List Body */}
        <div class="p-lg overflow-y-auto space-y-md flex-1">
          <h4 class="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Detailed Fee Invoices
          </h4>
          <div class="space-y-sm">
            {group.invoices.map((inv) => (
              <div
                key={inv.id}
                class="bg-surface-container-low/70 hover:bg-surface-container-low border border-outline-variant/40 rounded-xl p-md transition-all flex flex-wrap items-center justify-between gap-md"
              >
                <div class="flex items-center gap-md min-w-[220px]">
                  <div class="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <span class="material-symbols-outlined text-[22px]">receipt_long</span>
                  </div>
                  <div>
                    <h5 class="font-bold text-on-surface text-body-md">{inv.feeType || 'General Fee'}</h5>
                    <p class="text-xs text-on-surface-variant">
                      Term: <span class="font-semibold text-on-surface">{inv.term || '—'}</span> • Due: <span class="font-semibold text-on-surface">{inv.dueDate || '—'}</span>
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-xl">
                  <div>
                    <p class="text-[10px] font-bold uppercase text-on-surface-variant">Amount</p>
                    <p class="font-bold text-on-surface text-body-md">{formatCurrency(inv.amount)}</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold uppercase text-on-surface-variant">Paid</p>
                    <p class="font-bold text-on-surface text-body-md">
                      {inv.amountPaid > 0 ? formatCurrency(inv.amountPaid) : '—'}
                    </p>
                  </div>
                  <div>
                    <StatusChip status={inv.status} />
                  </div>
                </div>

                {/* Actions */}
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
                          onClick={() => {
                            if (pendingMethod) {
                              onMarkAsPaid(inv, pendingMethod);
                              setMarkingChoiceId(null);
                              setPendingMethod('');
                            }
                          }}
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
                        type="button"
                        onClick={() => { setMarkingChoiceId(inv.id); setPendingMethod(''); }}
                        title="Record full payment received"
                        class="flex items-center gap-xs text-secondary hover:bg-secondary-container/10 px-sm py-1.5 rounded-lg transition-colors font-label-md text-xs active:scale-95 border border-secondary/20"
                      >
                        <span class="material-symbols-outlined text-[16px]">check_circle</span>
                        Mark Paid
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() => onEditInvoice(inv)}
                    title="Edit invoice"
                    class="flex items-center gap-xs text-on-surface-variant hover:bg-surface-container-high px-sm py-1.5 rounded-lg transition-colors font-label-md text-xs active:scale-95 border border-outline-variant/40"
                  >
                    <span class="material-symbols-outlined text-[16px]">edit</span>
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenNoticeModal(inv)}
                    title="Generate Smart AI Parent Notice"
                    class="flex items-center gap-xs text-primary hover:bg-primary-fixed px-sm py-1.5 rounded-lg transition-colors font-label-md text-xs active:scale-95 border border-primary/20"
                  >
                    <span class="material-symbols-outlined text-[16px]">auto_awesome</span>
                    AI Notice
                  </button>

                  {inv.status !== 'Paid' && (
                    <button
                      type="button"
                      onClick={() => onSendReminder(inv.id)}
                      title="Send Quick Reminder"
                      class="flex items-center gap-xs text-on-surface-variant hover:bg-surface-container-high px-sm py-1.5 rounded-lg transition-colors font-label-md text-xs active:scale-95 border border-outline-variant/40"
                    >
                      <span class="material-symbols-outlined text-[16px]">send</span>
                      Reminder
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div class="p-md bg-surface-container-low border-t border-outline-variant/40 flex justify-between items-center">
          <span class="text-xs text-on-surface-variant">
            Click any invoice action above to update or notify.
          </span>
          <button
            type="button"
            onClick={onClose}
            class="bg-primary text-on-primary font-label-md px-lg py-sm rounded-lg hover:opacity-90 transition-all shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
