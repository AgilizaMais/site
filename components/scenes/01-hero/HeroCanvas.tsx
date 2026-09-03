'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useDeviceTier } from '@/lib/hooks/useDeviceTier';
import { useInViewport } from '@/lib/hooks/useInViewport';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';
import type { HeroFrame } from './useHeroFrame';

/**
 * three + R3F ficam fora do bundle de servidor e do first-load JS:
 * o chunk só é buscado quando o Hero decide montar a cena.
 */
const HeroScene = dynamic(() => import('./HeroScene').then((m) => m.HeroScene), {
  ssr: false,
});

/**
 * Camada WebGL do Hero. Sem contexto WebGL utilizável (ou em movimento
 * reduzido) cai para um halo estático em CSS — a cena continua composta,
 * apenas parada. Nunca um spinner, nunca um buraco preto.
 */
export function HeroCanvas({ frame }: { frame: HeroFrame }) {
  const tier = useDeviceTier();
  const { reduced } = useMotionPreference();
  const [mounted, setMounted] = useState(false);
  const { ref, inView } = useInViewport<HTMLDivElement>();

  // O canvas só monta depois da primeira pintura: o LCP é a headline, não o WebGL.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const noWebgl = tier === 'none' && !reduced;

  return (
    <div ref={ref} className="absolute inset-0" aria-hidden>
      {/* Halo de base: existe nos três estados e ancora a composição. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(38% 42% at 50% 44%, rgba(249,115,22,0.10) 0%, rgba(249,115,22,0.03) 40%, transparent 72%)',
        }}
      />
      {mounted && !noWebgl && (
        <HeroScene tier={tier === 'none' ? 'mid' : tier} reduced={reduced} active={inView} frame={frame} />
      )}
    </div>
  );
}
