import React from 'react';

export default function StatusChip({ status }) {
  const normalized = (status || '').toLowerCase();

  let styles = 'bg-surface-container-high text-on-surface-variant';

  if (normalized === 'paid' || normalized === 'present') {
    styles = 'bg-secondary-container/20 text-on-secondary-container';
  } else if (normalized === 'overdue' || normalized === 'absent') {
    styles = 'bg-error-container/20 text-on-error-container';
  } else if (normalized === 'pending') {
    styles = 'bg-surface-container-highest text-on-surface-variant';
  } else if (normalized === 'late') {
    styles = 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
  }

  return (
    <span class={`px-xs py-1 rounded-full text-xs font-bold uppercase tracking-tighter inline-block ${styles}`}>
      {status}
    </span>
  );
}
