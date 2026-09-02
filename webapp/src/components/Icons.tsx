/** Small inline brand icons — crisp at any density, no emoji fallback needed. */

export function IconTelegram({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.04 15.61l-.36 5.1c.52 0 .75-.22 1.03-.5l2.49-2.38 5.16 3.78c.95.52 1.62.25 1.88-.88l3.4-15.94c.31-1.4-.5-1.96-1.43-1.61L1.2 8.93c-1.37.53-1.35 1.29-.24 1.64l5.1 1.59L17.9 4.72c.56-.36 1.07-.16.65.21L9.04 15.61z" />
    </svg>
  );
}

export function IconBuyers({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
      <circle cx="16.8" cy="9.4" r="2.5" />
      <path d="M15.6 13.6c2.6-.4 4.6 1.2 5.1 4" />
    </svg>
  );
}

export function IconHandshake({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8M3.6 15h16.8" />
      <path d="M12 3a13.5 13.5 0 0 1 0 18M12 3a13.5 13.5 0 0 0 0 18" />
    </svg>
  );
}

export function IconExport({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 17.5h17" />
      <path d="M5 17.5V9l4.5-2v10.5M14.5 17.5V7l5 2.2v8.3" />
      <path d="M9.5 12h5M12.5 10l2 2-2 2" />
    </svg>
  );
}

export function IconCheck({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 12.5l5 5 10-11" />
    </svg>
  );
}
