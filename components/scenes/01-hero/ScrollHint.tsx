'use client';

import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { hero } from '@/lib/content/site';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';

/** Aparece depois da entrada e desaparece ao primeiro scroll. */
export function ScrollHint() {
  const { reduced } = useMotionPreference();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => window.scrollY > 40 && setScrolled(true);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <m.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: scrolled ? 0 : 1 }}
      transition={{ duration: 0.8, delay: reduced ? 0 : 1.8, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-3 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted"
    >
      <m.span
        className="block h-8 w-px origin-top bg-hairline"
        animate={reduced ? undefined : { scaleY: [0.3, 1, 0.3] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {hero.scrollHint}
    </m.div>
  );
}
