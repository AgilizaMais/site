'use client';

import { useEffect, useState } from 'react';
import { m, useMotionValue, useSpring } from 'framer-motion';
import { usePointerFine } from '@/lib/hooks/usePointerFine';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';

type State = 'idle' | 'hover' | 'text';

/**
 * Cursor premium: ponto + anel com lag. Renderizado apenas em ponteiro fino
 * e fora do modo reduzido. O cursor nativo nunca é escondido.
 * docs/STYLE_GUIDE.md §5
 */
export function Cursor() {
  const fine = usePointerFine();
  const { reduced } = useMotionPreference();
  const [state, setState] = useState<State>('idle');
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 260, damping: 30, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 260, damping: 30, mass: 0.5 });

  const active = fine && !reduced;

  useEffect(() => {
    if (!active) return;

    let idleTimer: number;

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setVisible(false), 2500);

      const el = e.target as HTMLElement | null;
      const interactive = el?.closest('a, button, [data-cursor="hover"], [role="button"]');
      const text = el?.closest('[data-cursor="text"]');
      setState(interactive ? 'hover' : text ? 'text' : 'idle');
    };

    const onDown = () => document.documentElement.setAttribute('data-cursor-down', '');
    const onUp = () => document.documentElement.removeAttribute('data-cursor-down');
    const onLeave = () => setVisible(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('pointerleave', onLeave);

    return () => {
      window.clearTimeout(idleTimer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointerleave', onLeave);
      onUp();
    };
  }, [active, x, y]);

  if (!active) return null;

  const ringSize = state === 'hover' ? 48 : state === 'text' ? 24 : 28;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70]">
      <m.span
        className="absolute left-0 top-0 rounded-full border"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
          borderColor: state === 'hover' ? 'var(--accent-line)' : 'var(--hairline)',
        }}
        animate={{
          width: state === 'text' ? 2 : ringSize,
          height: ringSize,
          opacity: visible ? 1 : 0,
          borderRadius: state === 'text' ? 2 : 999,
        }}
        transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
      />
      <m.span
        className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-text"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
        animate={{ opacity: visible && state === 'idle' ? 0.7 : 0 }}
        transition={{ duration: 0.12 }}
      />
    </div>
  );
}
