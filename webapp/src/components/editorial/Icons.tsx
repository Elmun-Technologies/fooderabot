/**
 * Hand-drawn line icons for the editorial landing.
 *
 * Deliberately not emoji and not an icon package: every glyph is a couple of
 * strokes in the current colour, so it inherits the text colour, scales with
 * `font-size`, and costs nothing in the bundle. Strokes are 1.5 px in a 24 px
 * grid, which is the same optical weight as the Manrope headings next to them.
 */

interface IconProps {
  size?: number;
  className?: string;
}

function Svg({ size = 24, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/* ------------------------------- categories ------------------------------- */

const CATEGORY_PATHS: Record<string, React.ReactNode> = {
  drinks: (
    <>
      <path d="M10 3h4M11 3v3.2L8.6 9.4A3 3 0 0 0 8 11.2V19a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-7.8a3 3 0 0 0-.6-1.8L13 6.2V3" />
      <path d="M8 13h8" />
    </>
  ),
  tea_coffee: (
    <>
      <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
      <path d="M16 10h1.6a2.4 2.4 0 0 1 0 4.8H16" />
      <path d="M7 6c0-1 1-1.4 1-2.4M11 6c0-1 1-1.4 1-2.4" />
    </>
  ),
  grocery: (
    <>
      <path d="M4 8h16l-1.6 11.2a1 1 0 0 1-1 .8H6.6a1 1 0 0 1-1-.8z" />
      <path d="M8.5 8a3.5 3.5 0 0 1 7 0" />
    </>
  ),
  confectionery: (
    <>
      <path d="M4 15h16v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M6 15v-2.5A2.5 2.5 0 0 1 8.5 10h7A2.5 2.5 0 0 1 18 12.5V15" />
      <path d="M12 10V7.5A2.5 2.5 0 0 1 14.5 5" />
      <path d="M4 18.5h16" />
    </>
  ),
  dairy: (
    <>
      <path d="M8 3h8M9 3v3.2L7 9v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9l-2-2.8V3" />
      <path d="M7 12.5h10" />
    </>
  ),
  meat: (
    <>
      <path d="M14.5 3.5c3 0 6 3 6 6 0 3.5-3.5 5-6 5-1.2 0-2 .8-2.6 1.9-.6 1.2-1.6 2.6-3.4 2.6A4 4 0 0 1 4 15c0-4.5 4.5-6 7-6 1.6 0 2.2-1.4 2.2-3 0-.9-.2-1.9.3-2.5z" />
      <circle cx="17.5" cy="9.5" r="1.2" />
    </>
  ),
  frozen: (
    <>
      <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5 4.2 16.5" />
      <path d="M12 7.2 10 5.4M12 7.2l2-1.8M12 16.8l-2 1.8M12 16.8l2 1.8" />
    </>
  ),
  canned: (
    <>
      <ellipse cx="12" cy="6" rx="5" ry="2" />
      <path d="M7 6v12a5 2 0 0 0 10 0V6" />
      <path d="M9 11h6" />
    </>
  ),
  oil_sauces: (
    <>
      <path d="M10 3h4v2.2l1.8 2A4 4 0 0 1 17 9.6V19a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9.6a4 4 0 0 1 1.2-4.4L10 5.2z" />
      <path d="M9 13.5h6" />
    </>
  ),
  deli: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" />
    </>
  ),
  organic: (
    <>
      <path d="M20 4c0 8-5 12-11 12H5c0-7 5-11 11-11 2 0 3.2-.4 4-1z" />
      <path d="M4 20c2.5-5 6-7.5 10-9" />
    </>
  ),
  equipment: (
    <>
      <rect x="3.5" y="8" width="17" height="11" rx="2" />
      <path d="M8 8V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V8" />
      <path d="M3.5 13h17M7.5 16.5h3" />
    </>
  ),
  other: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
    </>
  ),
};

export function CategoryIcon({ category, size }: { category: string; size?: number }) {
  return <Svg size={size}>{CATEGORY_PATHS[category] ?? CATEGORY_PATHS.other}</Svg>;
}

/* -------------------------------- audience -------------------------------- */

const AUDIENCE_PATHS: Record<string, React.ReactNode> = {
  retail: (
    <>
      <path d="M4 9h16l-1 10.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5z" />
      <path d="M8.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
    </>
  ),
  distributor: (
    <>
      <rect x="3" y="6.5" width="8" height="6" rx="1" />
      <path d="M11 9.5h4.5l2.5 2.7v.3H11z" />
      <circle cx="6.5" cy="15.5" r="1.6" />
      <circle cx="15.5" cy="15.5" r="1.6" />
    </>
  ),
  horeca: (
    <>
      <path d="M5 4v6a3 3 0 0 0 6 0V4" />
      <path d="M8 13v7" />
      <path d="M17 4c1.6 1 2.4 2.6 2.4 4.4 0 1.7-1 2.8-2.4 3.1V20" />
      <path d="M17 4v5" />
    </>
  ),
  import: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.7 12h16.6" />
      <path d="M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5S14.4 18.2 12 20.5C9.6 18.2 8.4 15.3 8.4 12S9.6 5.8 12 3.5z" />
    </>
  ),
  marketplace: (
    <>
      <rect x="3.5" y="4.5" width="17" height="12" rx="2" />
      <path d="M3.5 8.5h17M8 20h8M12 16.5V20" />
    </>
  ),
  state: (
    <>
      <path d="M4 9.5 12 4l8 5.5" />
      <path d="M5.5 9.5V19M18.5 9.5V19M9.5 19v-5M14.5 19v-5M3.5 19.5h17" />
    </>
  ),
};

export function AudienceIcon({ icon, size }: { icon: string; size?: number }) {
  return <Svg size={size}>{AUDIENCE_PATHS[icon]}</Svg>;
}

/* ------------------------ included / venue / misc --------------------------- */

const MISC_PATHS: Record<string, React.ReactNode> = {
  pdf: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 16.5h4" />
    </>
  ),
  report: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 15.5v-3M12 15.5v-6M16 15.5v-4" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
      <path d="M12 14v2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  plane: (
    <>
      <path d="M3 13.5l18-6.5-4 12.5-4.5-3.5-3 3.5-.5-4.5z" />
    </>
  ),
  train: (
    <>
      <rect x="5.5" y="3.5" width="13" height="12.5" rx="3" />
      <path d="M5.5 10h13M9 16l-2 4M15 16l2 4M8.5 6.8h.01M15.5 6.8h.01" />
    </>
  ),
  car: (
    <>
      <path d="M4 16.5v-3l1.8-4.2A2 2 0 0 1 7.6 8h8.8a2 2 0 0 1 1.8 1.3L20 13.5v3" />
      <path d="M4 16.5h16M6.5 16.5V19M17.5 16.5V19M5.5 13.5h13" />
    </>
  ),
  bed: (
    <>
      <path d="M3.5 18.5v-8M3.5 14.5h17v4M20.5 14.5a3 3 0 0 0-3-3h-6.5v3" />
      <circle cx="8" cy="13" r="1.8" />
    </>
  ),
  arrow: <path d="M4.5 12h15M13.5 6l6 6-6 6" />,
  arrowUp: <path d="M12 19.5v-15M6 10.5 12 4.5l6 6" />,
  spark: <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  telegram: (
    <>
      <path d="M20.5 4.5 3.8 11.2l5 1.6 1.7 5.4 2.4-3 4.3 3.3z" />
      <path d="M8.8 12.8l9.2-7-6.4 8.6" />
    </>
  ),
  phone: (
    <path d="M6.5 3.5h2.2l1.5 3.6-1.8 1.4a10 10 0 0 0 4.9 4.9l1.4-1.8 3.6 1.5v2.2a2.2 2.2 0 0 1-2.4 2.2C10.6 18.9 5.1 13.4 4.3 5.9A2.2 2.2 0 0 1 6.5 3.5z" />
  ),
  pin: (
    <>
      <path d="M12 21s6.5-6 6.5-10.5a6.5 6.5 0 0 0-13 0C5.5 15 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.4" />
    </>
  ),
  soundOn: (
    <>
      <path d="M4.5 9.5h3l4-3.5v12l-4-3.5h-3z" />
      <path d="M15 9a4 4 0 0 1 0 6M17.6 6.6a7.5 7.5 0 0 1 0 10.8" />
    </>
  ),
  soundOff: (
    <>
      <path d="M4.5 9.5h3l4-3.5v12l-4-3.5h-3z" />
      <path d="M15 9.5l5 5M20 9.5l-5 5" />
    </>
  ),
  booth: (
    <>
      <path d="M4 9.5 6 4h12l2 5.5" />
      <path d="M4 9.5h16M5.5 9.5V20h13V9.5" />
      <path d="M9 20v-5.5h6V20" />
    </>
  ),
  ticket: (
    <>
      <path d="M3.5 8.5A2 2 0 0 0 5.5 6.5h13a2 2 0 0 0 2 2 2 2 0 0 0 0 4 2 2 0 0 0-2 2h-13a2 2 0 0 0-2-2 2 2 0 0 0 0-4z" />
      <path d="M14 6.8v10.4" strokeDasharray="1.4 1.4" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.6 12h16.8M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5S14.3 18.1 12 20.5c-2.3-2.4-3.5-5.2-3.5-8.5S9.7 5.9 12 3.5z" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.4" />
      <rect x="13" y="4" width="7" height="7" rx="1.4" />
      <rect x="4" y="13" width="7" height="7" rx="1.4" />
      <path d="M13 16.5h7M16.5 13v7" />
    </>
  ),
};

export function Icon({ name, size, className }: { name: string; size?: number; className?: string }) {
  return <Svg size={size} className={className}>{MISC_PATHS[name]}</Svg>;
}
