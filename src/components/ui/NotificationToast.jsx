import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, iconForType, accentForType } from '../../context/NotificationContext';

const AUTO_DISMISS_MS = 6000;

function Toast({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();

  const close = () => {
    setExiting(true);
    setTimeout(onDismiss, 180);
  };

  useEffect(() => {
    if (paused) return undefined;
    timeoutRef.current = setTimeout(close, AUTO_DISMISS_MS);
    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  const handleClick = () => {
    if (toast.data?.route) navigate(toast.data.route);
    close();
  };

  return (
    <div
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      class={`pointer-events-auto w-[360px] max-w-[92vw] bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-2xl overflow-hidden cursor-pointer ${
        exiting ? 'animate-slideOutRight' : 'animate-slideInRight'
      }`}
      onClick={handleClick}
    >
      <div class="flex items-start gap-sm p-md">
        <div class={`shrink-0 w-8 h-8 rounded-full ${accentForType(toast.type)} flex items-center justify-center`}>
          <span class="material-symbols-outlined text-white text-[18px]">{iconForType(toast.type)}</span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-label-md text-on-surface font-bold leading-snug truncate">{toast.title}</p>
          {toast.body && (
            <p class="text-body-md text-on-surface-variant leading-snug mt-0.5 line-clamp-2">{toast.body}</p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            close();
          }}
          class="shrink-0 p-1 -m-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors"
        >
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
      <div class="h-[3px] bg-surface-container-high w-full">
        <div
          class={`h-full ${accentForType(toast.type)}`}
          style={{
            animation: paused ? 'none' : `shrinkWidth ${AUTO_DISMISS_MS}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

/** Mount once near the root — stacks toasts top-right, Claude-web style. */
export default function NotificationToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div class="fixed top-20 right-6 z-[100] flex flex-col gap-sm pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.toastId} toast={toast} onDismiss={() => dismissToast(toast.toastId)} />
      ))}
    </div>
  );
}
