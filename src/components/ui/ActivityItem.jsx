import React from 'react';

export default function ActivityItem({ title, subtitle, timestamp, icon, bg = 'bg-primary-fixed', color = 'text-primary' }) {
  return (
    <div class="flex gap-md">
      <div class={`w-10 h-10 ${bg} rounded-full flex items-center justify-center ${color} shrink-0`}>
        <span class="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p class="text-body-md font-bold text-on-surface">{title}</p>
        <p class="text-body-md text-on-surface-variant">{subtitle}</p>
        <span class="text-label-sm text-outline mt-1 block">{timestamp}</span>
      </div>
    </div>
  );
}
