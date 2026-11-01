/** Ícones em traço (SVG). Herdam a cor do texto via `currentColor`. */
const PATHS = {
  play: <path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none" />,
  reverse: <path d="M17 4.5v15L4 12z" fill="currentColor" stroke="none" />,
  pause: <path d="M8 5v14M16 5v14" />,
  restart: <><path d="M4 12a8 8 0 1 0 2.5-5.8" /><path d="M4 4v5h5" /></>,
  swap: <><path d="M4 9h13l-3-3" /><path d="M20 15H7l3 3" /></>,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  eyeOff: <><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" /><circle cx="12" cy="12" r="2.5" /><path d="M4 4l16 16" /></>,
  eye: <><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" /><circle cx="12" cy="12" r="2.5" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" /></>,
  pair: <><circle cx="8" cy="8" r="3.5" /><circle cx="16" cy="8" r="3.5" /><path d="M2 20a6 6 0 0 1 12 0M10 20a6 6 0 0 1 12 0" /></>,
  pencil: <path d="M4 20h4L19 9l-4-4L4 16z" />,
  check: <path d="M5 12l5 5 9-10" />,
  equal: <path d="M5 9h14M5 15h14" />,
  notEqual: <path d="M5 9h14M5 15h14M15 5L9 19" />,
  mask: <><path d="M3 7c3-2 15-2 18 0 0 6-3 11-9 11S3 13 3 7z" /><path d="M8 11h2M14 11h2" /></>,
  back: <path d="M15 6l-6 6 6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  thermo: <><path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z" /><path d="M12 11v6" /></>,
  hand: <><path d="M9 11V5a2 2 0 1 1 4 0v5" /><path d="M13 10V8a2 2 0 1 1 4 0v4" /><path d="M17 11a2 2 0 1 1 4 0v3a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.5L4.5 14a2 2 0 0 1 3.4-2L9 13.5" /></>,
  muted: <><path d="M11 5L6 9H3v6h3l5 4z" /><path d="M22 9l-6 6M16 9l6 6" /></>,
  backspace: <><path d="M21 5H9l-6 7 6 7h12z" /><path d="M17 9l-5 6M12 9l5 6" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
      {PATHS[name]}
    </svg>
  );
}
