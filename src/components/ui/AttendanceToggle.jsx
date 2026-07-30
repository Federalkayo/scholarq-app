import React from 'react';

export default function AttendanceToggle({ value, onChange }) {
  const options = [
    { key: 'Present', label: 'P', activeClass: 'bg-secondary text-on-secondary' },
    { key: 'Absent', label: 'A', activeClass: 'bg-error text-on-error' },
    { key: 'Late', label: 'L', activeClass: 'bg-tertiary-container text-on-tertiary-container' }
  ];

  return (
    <div class="inline-flex bg-surface-container-low p-1 rounded-lg border border-outline-variant gap-1">
      {options.map((opt) => {
        const isActive = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange && onChange(opt.key)}
            class={`px-md py-xs rounded-md text-label-md font-bold transition-all ${
              isActive
                ? `${opt.activeClass} shadow-sm`
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
