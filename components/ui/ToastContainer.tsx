"use client";

import { useAdminApp } from "@/context/AdminAppContext";

const ICONS = {
  success: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  info: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

export default function ToastContainer() {
  const { toasts } = useAdminApp();

  return (
    <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-300 flex flex-col gap-2 items-center pointer-events-none px-4">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type} pointer-events-auto`}>
          <span className="shrink-0 opacity-90">{ICONS[t.type]}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
