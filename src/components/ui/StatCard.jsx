import React from 'react';

export default function StatCard({ label, value, trend, trendType = 'positive', icon, iconBg = 'bg-primary-fixed', iconColor = 'text-primary' }) {
  const getTrendStyle = () => {
    if (trendType === 'positive') return 'text-secondary font-bold text-label-sm';
    if (trendType === 'negative') return 'text-error font-bold text-label-sm';
    return 'text-on-surface-variant font-bold text-label-sm';
  };

  return (
    <div class="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant flex flex-col hover-lift cursor-pointer">
      <div class="flex items-center justify-between mb-md">
        <span class={`material-symbols-outlined ${iconColor} p-2 ${iconBg} rounded-lg transition-transform group-hover:scale-110`}>{icon}</span>
        {trend && <span class={getTrendStyle()}>{trend}</span>}
      </div>
      <span class="text-label-sm text-on-surface-variant uppercase tracking-widest font-bold">{label}</span>
      <span class="font-display-lg text-display-lg mt-1 text-on-surface">{value}</span>
    </div>
  );
}
