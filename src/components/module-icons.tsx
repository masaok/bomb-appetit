import type { ReactNode } from "react";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const icons: Record<string, ReactNode> = {
  wires: (
    <>
      <path d="M4 12q8-6 16 0t16 0" {...stroke} stroke="#f04a3a" />
      <path d="M4 20q8-6 16 0t16 0" {...stroke} />
      <path d="M4 28q8-6 16 0t16 0" {...stroke} stroke="#fff" />
    </>
  ),
  "big-button": (
    <>
      <circle cx="20" cy="20" r="15" {...stroke} fill="#fff" />
      <circle cx="20" cy="20" r="9" {...stroke} fill="#f04a3a" />
    </>
  ),
  "glyph-keypad": (
    <>
      <rect x="5" y="5" width="30" height="30" rx="5" {...stroke} fill="#fff" />
      <path d="M20 5v30M5 20h30" {...stroke} />
      <path d="M10 15l2.5-5 2.5 5z" {...stroke} />
      <circle cx="27.5" cy="12.5" r="2.5" {...stroke} />
      <path d="M10 30q2.5-6 5 0" {...stroke} />
      <path d="M25 25l5 5m0-5l-5 5" {...stroke} />
    </>
  ),
  "color-echo": (
    <>
      <rect x="5" y="5" width="13" height="13" rx="4" {...stroke} fill="#f04a3a" />
      <rect x="22" y="5" width="13" height="13" rx="4" {...stroke} fill="#6ec1ff" />
      <rect x="5" y="22" width="13" height="13" rx="4" {...stroke} fill="#fff" />
      <rect x="22" y="22" width="13" height="13" rx="4" {...stroke} fill="#5b4b9a" />
    </>
  ),
  "word-grid": (
    <>
      <rect x="8" y="4" width="24" height="9" rx="3" {...stroke} fill="#fff" />
      <path d="M13 8.5h14" {...stroke} />
      <rect x="4" y="18" width="14" height="7" rx="2.5" {...stroke} />
      <rect x="22" y="18" width="14" height="7" rx="2.5" {...stroke} />
      <rect x="4" y="29" width="14" height="7" rx="2.5" {...stroke} />
      <rect x="22" y="29" width="14" height="7" rx="2.5" {...stroke} />
    </>
  ),
  recall: (
    <>
      <rect x="10" y="4" width="20" height="14" rx="4" {...stroke} fill="#fff" />
      <path d="M18 8l3-1v8" {...stroke} />
      <circle cx="7" cy="30" r="3.5" {...stroke} />
      <circle cx="16" cy="30" r="3.5" {...stroke} fill="#f04a3a" />
      <circle cx="25" cy="30" r="3.5" {...stroke} />
      <circle cx="34" cy="30" r="3.5" {...stroke} />
    </>
  ),
  blinker: (
    <>
      <circle cx="20" cy="21" r="8" {...stroke} fill="#fff" />
      <path d="M20 4v4M6 21H3M37 21h-3M9 10l2.5 2.5M31 10l-2.5 2.5M14 35h12" {...stroke} />
    </>
  ),
  "tangled-wires": (
    <>
      <path d="M8 5c0 16 24 14 24 30" {...stroke} stroke="#f04a3a" />
      <path d="M32 5c0 16-24 14-24 30" {...stroke} stroke="#fff" />
      <path d="M20 5c8 10-8 20 0 30" {...stroke} />
    </>
  ),
  "wire-panels": (
    <>
      <rect x="9" y="4" width="26" height="27" rx="4" {...stroke} />
      <rect x="5" y="9" width="26" height="27" rx="4" {...stroke} fill="#fff" />
      <path d="M11 16h14" {...stroke} stroke="#f04a3a" />
      <path d="M11 22.5h14" {...stroke} />
      <path d="M11 29h14" {...stroke} stroke="#6ec1ff" />
    </>
  ),
  labyrinth: (
    <>
      <rect x="4" y="4" width="32" height="32" rx="5" {...stroke} fill="#fff" />
      <path d="M12 4v16h8M28 36V20M20 12h16M12 28h8" {...stroke} />
      <circle cx="32" cy="30" r="2" fill="#f04a3a" />
    </>
  ),
  passcode: (
    <>
      <rect x="4" y="9" width="9" height="22" rx="3" {...stroke} fill="#fff" />
      <rect x="15.5" y="9" width="9" height="22" rx="3" {...stroke} fill="#fff" />
      <rect x="27" y="9" width="9" height="22" rx="3" {...stroke} fill="#fff" />
      <path d="M6.5 20h4M18 20h4M29.5 20h4" {...stroke} />
      <path d="M8.5 5v0M20 5v0M31.5 5v0M8.5 35v0M20 35v0M31.5 35v0" {...stroke} />
    </>
  ),
  "pressure-vent": (
    <>
      <rect x="4" y="5" width="32" height="15" rx="4" {...stroke} fill="#fff" />
      <path d="M12 12.5h16" {...stroke} />
      <rect x="4" y="25" width="14" height="10" rx="3" {...stroke} fill="#5fd3a6" />
      <rect x="22" y="25" width="14" height="10" rx="3" {...stroke} fill="#f04a3a" />
    </>
  ),
  "discharge-lever": (
    <>
      <rect x="5" y="27" width="30" height="8" rx="3" {...stroke} fill="#fff" />
      <path d="M20 27L29 9" {...stroke} />
      <circle cx="30" cy="8" r="4.5" {...stroke} fill="#f04a3a" />
    </>
  ),
  "dial-alignment": (
    <>
      <circle cx="20" cy="20" r="10" {...stroke} fill="#fff" />
      <path d="M20 20l5-6" {...stroke} />
      <path d="M20 4v0M36 20v0M20 36v0M4 20v0M31.5 8.5v0M31.5 31.5v0M8.5 31.5v0M8.5 8.5v0" {...stroke} strokeWidth={3.5} />
    </>
  ),
};

export function ModuleIcon({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      {icons[id]}
    </svg>
  );
}
