'use client';

import { useRef } from 'react';
import { m, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { usePointerFine } from '@/lib/hooks/usePointerFine';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  className?: string;
};

const RADIUS = 80;
const MAX_OFFSET = 8;

/**
 * Botão com magnetismo discreto (≤8px) — desativado em touch e no modo reduzido.
 * docs/STYLE_GUIDE.md §5 · docs/ANIMATION_SYSTEM.md §6
 */
export function MagneticButton({ href, children, variant = 'primary', className = '' }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const fine = usePointerFine();
  const { reduced } = useMotionPreference();
  const systemReduced = useReducedMotion();
  const magnetic = fine && !reduced && !systemReduced;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 150, damping: 15, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 150, damping: 15, mass: 0.6 });

  const handleMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (!magnetic || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(dx, dy);
    const strength = Math.max(0, 1 - distance / (RADIUS + rect.width / 2));
    x.set(dx * strength * (MAX_OFFSET / RADIUS) * 2);
    y.set(dy * strength * (MAX_OFFSET / RADIUS) * 2);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const base =
    'group relative inline-flex items-center gap-3 rounded-full px-8 text-[0.9375rem] font-medium tracking-[-0.01em] h-[52px] md:h-[56px] transition-colors duration-fast ease-out-soft';
  const skin =
    variant === 'primary'
      ? 'bg-accent text-bg'
      : 'border border-hairline text-text hover:border-accent-line hover:bg-surface/40';

  return (
    <m.a
      ref={ref}
      href={href}
      data-cursor="hover"
      onPointerMove={handleMove}
      onPointerLeave={reset}
      onBlur={reset}
      style={magnetic ? { x: sx, y: sy } : undefined}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.12 }}
      className={`${base} ${skin} ${className}`}
    >
      {/* Halo — cresce no hover, nunca pisca. */}
      {variant === 'primary' && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-full opacity-0 blur-xl transition-opacity duration-base ease-out-expo group-hover:opacity-100"
          style={{ background: 'var(--accent)', transform: 'scale(1.15)' }}
        />
      )}
      <span>{children}</span>
      <svg
        aria-hidden
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        className="translate-x-0 transition-transform duration-fast ease-out-soft group-hover:translate-x-1"
      >
        <path d="M1 7h11M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      </svg>
    </m.a>
  );
}
