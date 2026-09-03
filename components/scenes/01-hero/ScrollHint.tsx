'use client';

import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { hero } from '@/lib/content/site';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';

/**
 * Convite a rolar. Aparece depois da entrada e some ao primeiro scroll.
 *
 * A seta é fina e ESTÁTICA. Uma seta pulsando é um pedido, e a primeira tela
 * já disse o que tinha para dizer — aqui basta indicar a direção.
 */
export function ScrollHint({ className = '' }: { className?: string }) {
  const { reduced, resolved } = useMotionPreference();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => window.scrollY > 40 && setScrolled(true);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <m.div
      aria-hidden
      data-scroll-hint
      initial={{ opacity: 0 }}
      animate={resolved ? { opacity: scrolled ? 0 : 1 } : undefined}
      transition={{ duration: 0.8, delay: reduced ? 0 : 2.6, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-center gap-3 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-muted ${className}`}
    >
      <svg width="10" height="30" viewBox="0 0 10 30" fill="none" className="shrink-0">
        <path
          d="M5 0v28M1 24l4 4 4-4"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-hairline"
        />
      </svg>
      {hero.scrollHint}
    </m.div>
  );
}
