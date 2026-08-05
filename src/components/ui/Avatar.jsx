import React from 'react';

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg'
};

export default function Avatar({ src, alt, initials, size = 'w-10 h-10', border = '' }) {
  const resolvedSize = sizeMap[size] || size || 'w-10 h-10';

  if (src) {
    return (
      <img
        src={src}
        alt={alt || initials || 'Avatar'}
        class={`${resolvedSize} shrink-0 rounded-full object-cover ${border}`}
      />
    );
  }

  return (
    <div class={`${resolvedSize} shrink-0 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-bold ${border}`}>
      {initials || 'U'}
    </div>
  );
}
