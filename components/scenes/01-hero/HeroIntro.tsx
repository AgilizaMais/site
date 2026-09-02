'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { skipIntro } from '@/lib/motion/introBus';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';

/**
 * Entrada cinematográfica: uma linha de luz de 1px que se abre e dissolve.
 * Sem porcentagem, sem spinner — o site abre, não carrega.
 * Qualquer interação encerra a entrada imediatamente.
 */
export function HeroIntro() {
  const { reduced } = useMotionPreference();
  const [done, setDone] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setDone(true);
      return;
    }

    const timer = window.setTimeout(() => setDone(true), 700);
    const skip = () => {
      window.clearTimeout(timer);
      setDone(true);
      skipIntro();
    };

    window.addEventListener('wheel', skip, { once: true, passive: true });
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
    };
  }, [reduced]);

  return (
    <AnimatePresence>
      {!done && (
        <m.div
          aria-hidden
          className="fixed inset-0 z-[80] flex items-center justify-center bg-bg"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
        >
          <m.span
            className="block h-px bg-text"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'min(52vw, 560px)', opacity: [0, 1, 0.35] }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        </m.div>
      )}
    </AnimatePresence>
  );
}
