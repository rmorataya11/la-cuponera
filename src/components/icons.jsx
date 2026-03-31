/** Iconos SVG minimalistas (stroke 1.5, currentColor) — reutilizables en toda la app. */
const s = 1.5;

export function IconNavDashboard({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={s} />
      <rect x="14" y="3" width="7" height="4" rx="1" stroke="currentColor" strokeWidth={s} />
      <rect x="14" y="10" width="7" height="11" rx="1.5" stroke="currentColor" strokeWidth={s} />
      <rect x="3" y="13" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth={s} />
    </svg>
  );
}

export function IconNavTag({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M3 5a2 2 0 012-2h7.172a2 2 0 011.414.586l5.828 5.828A2 2 0 0120 10.828V19a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"
        stroke="currentColor"
        strokeWidth={s}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="7.5" r="1.25" stroke="currentColor" strokeWidth={s} fill="none" />
    </svg>
  );
}

export function IconNavBuilding({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 21V6a1 1 0 011-1h5a1 1 0 011 1v15M4 21h16M9 7h1M9 11h1M9 15h1M14 21V10a1 1 0 011-1h4a1 1 0 011 1v11M17 13h1M17 17h1"
        stroke="currentColor"
        strokeWidth={s}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconNavTicket({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 9V7a2 2 0 012-2h12a2 2 0 012 2v2M4 15v2a2 2 0 002 2h12a2 2 0 002-2v-2M4 9a3 3 0 006 0 3 3 0 006 0M4 15a3 3 0 006 0 3 3 0 006 0"
        stroke="currentColor"
        strokeWidth={s}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconNavUsers({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth={s} />
      <path d="M3 21v-1a4 4 0 014-4h4a4 4 0 014 4v1" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth={s} />
      <path d="M15 21v-1a3 3 0 013-3h1" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
    </svg>
  );
}

export function IconNavCoupon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth={s} />
      <path d="M8 9v6M10.5 8v8M13 9v6M15.5 8v8M18 9v6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
    </svg>
  );
}

export function IconArrowLeft({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconArrowRight({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCheck({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconX({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
    </svg>
  );
}

export function IconPencil({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 20h9M16.5 3.5a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L16.5 3.5z"
        stroke="currentColor"
        strokeWidth={s}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconAlertTriangle({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke="currentColor"
        strokeWidth={s}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPackage({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
        stroke="currentColor"
        strokeWidth={s}
      />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
    </svg>
  );
}

export function IconCircleCheck({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={s} />
      <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth={s} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconBan({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={s} />
      <path d="M5 5l14 14" stroke="currentColor" strokeWidth={s} strokeLinecap="round" />
    </svg>
  );
}
