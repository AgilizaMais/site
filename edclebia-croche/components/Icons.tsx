type P = { size?: number; className?: string; strokeWidth?: number };

export function WhatsAppIcon({ size = 22, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.47 1.07 2.88 1.21 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.43 9.44-9.43a9.38 9.38 0 0 1 9.43 9.44c0 5.2-4.24 9.43-9.44 9.43m8.03-17.47A11.28 11.28 0 0 0 12.05.7C5.8.7.7 5.79.7 12.05c0 2 .52 3.95 1.52 5.67L.6 23.6l6.02-1.58a11.33 11.33 0 0 0 5.42 1.38h.01c6.26 0 11.35-5.09 11.35-11.35 0-3.03-1.18-5.88-3.32-8.02" />
    </svg>
  );
}

export function ArrowRight({ size = 20, className, strokeWidth = 1.6 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function HeartLine({ size = 24, className, strokeWidth = 1.4 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" />
      <path d="M8.2 9.6c1.4-.6 3.1 0 3.8 1.5" opacity=".55" />
    </svg>
  );
}

export function InstagramIcon({ size = 20, className, strokeWidth = 1.6 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5.2" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MenuIcon({ size = 26, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" className={className} aria-hidden>
      <path d="M3.5 7h17M3.5 12h17M3.5 17h11" />
    </svg>
  );
}

export function CloseIcon({ size = 26, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" className={className} aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function PlusIcon({ size = 20, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function PillarIcon({ name, size = 30 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 32 32',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'hands':
      return (
        <svg {...common}>
          <circle cx="16" cy="12" r="6.5" />
          <path d="M11.5 7.6c3 1.6 6 1.6 9 0M10 12.4c4 2 8 2 12 0M11.4 16.6c3-1.4 6-1.4 9.2 0" />
          <path d="M22 17.5 27.5 27" />
          <path d="M27.5 27c.5.9-.6 1.6-1.2.9" />
          <path d="M4 26c3-3 6-2 8-4" opacity=".6" />
        </svg>
      );
    case 'ruler':
      return (
        <svg {...common}>
          <path d="M4 20.5 20.5 4 28 11.5 11.5 28Z" />
          <path d="M9 15.5l2.2 2.2M12.2 12.3l3.2 3.2M15.4 9.1l2.2 2.2M18.6 5.9l3.2 3.2" />
        </svg>
      );
    case 'palette':
      return (
        <svg {...common}>
          <path d="M16 4C9.4 4 4 9 4 15.2 4 21.4 9 26 14.6 26c1.6 0 2.2-1 2.2-2.1 0-1.6-1.4-2.1-1.4-3.6 0-1.3 1-2.1 2.4-2.1h3.1C25 18.2 28 15.6 28 12.6 28 7.7 22.6 4 16 4Z" />
          <circle cx="10.2" cy="14" r="1.5" />
          <circle cx="13.6" cy="9.2" r="1.5" />
          <circle cx="19.2" cy="8.8" r="1.5" />
          <circle cx="23" cy="12.6" r="1.5" />
        </svg>
      );
    case 'spark':
      return (
        <svg {...common}>
          <path d="M16 3.5 18.4 12 27 14.5 18.4 17 16 25.5 13.6 17 5 14.5 13.6 12Z" />
          <path d="M25.5 23.5l.8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8Z" />
        </svg>
      );
    case 'diamond':
      return (
        <svg {...common}>
          <path d="M9 5h14l5 7-12 15L4 12Z" />
          <path d="M4 12h24M12.5 5 11 12l5 15 5-15-1.5-7" />
        </svg>
      );
    case 'chat':
      return (
        <svg {...common}>
          <path d="M5 8.5A3.5 3.5 0 0 1 8.5 5h15A3.5 3.5 0 0 1 27 8.5v10a3.5 3.5 0 0 1-3.5 3.5H13l-6 5v-5.2A3.5 3.5 0 0 1 5 18.5Z" />
          <path d="M11 12.5h10M11 16.5h6" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M16 26.5s-10-6.2-10-13.6A5.7 5.7 0 0 1 16 9.3a5.7 5.7 0 0 1 10 3.6c0 7.4-10 13.6-10 13.6Z" />
        </svg>
      );
  }
}
