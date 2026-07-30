import React from 'react';

export default function Avatar({ src, alt, initials, size = 'w-10 h-10', border = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || initials || 'Avatar'}
        class={`${size} rounded-full object-cover ${border}`}
      />
    );
  }

  return (
    <div class={`${size} rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-bold text-label-md ${border}`}>
      {initials || 'U'}
    </div>
  );
}
