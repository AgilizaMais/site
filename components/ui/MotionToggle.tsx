'use client';

import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';

/** Controle explícito de movimento — o luxo nunca pode atropelar a acessibilidade. */
export function MotionToggle({
  className = '',
  compact = false,
}: {
  className?: string;
  /** Rótulo curto para o agrupamento do mobile. O rótulo lido continua inteiro. */
  compact?: boolean;
}) {
  const { reduced, toggle } = useMotionPreference();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={reduced}
      className={`font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted transition-colors duration-fast hover:text-text ${className}`}
    >
      <span className="sr-only">
        {reduced ? 'Ativar animações do site' : 'Reduzir animações do site'}
      </span>
      <span aria-hidden>
        {compact ? (reduced ? 'mov: off' : 'mov: on') : reduced ? 'movimento: off' : 'movimento: on'}
      </span>
    </button>
  );
}
