'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useDeviceTier } from '@/lib/hooks/useDeviceTier';
import { useInViewport } from '@/lib/hooks/useInViewport';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';

const SparksScene = dynamic(() => import('./SparksScene').then((m) => m.SparksScene), {
  ssr: false,
});

/**
 * As faíscas que passam À FRENTE da fotografia.
 *
 * São uma camada própria, e não parte da nuvem do cérebro, por um motivo de
 * ordem: a foto é DOM, e um canvas único não tem como ficar atrás e na frente
 * dela ao mesmo tempo. O cérebro fica atrás; isto aqui, na frente.
 *
 * Manter a foto no DOM (em vez de virar textura dentro da cena) é o que
 * garante que ela exista sem WebGL, tenha texto alternativo de verdade e
 * carregue como imagem para o navegador.
 */
export function HeroSparks({ delay }: { delay: number }) {
  const tier = useDeviceTier();
  const { reduced } = useMotionPreference();
  const [mounted, setMounted] = useState(false);
  const { ref, inView } = useInViewport<HTMLDivElement>();

  // Entra depois do cérebro: dois contextos WebGL abrindo no mesmo quadro
  // atrasam a primeira pintura.
  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 300);
    return () => window.clearTimeout(id);
  }, []);

  if (tier === 'none' && !reduced) return null;

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0" aria-hidden>
      {mounted && (
        <SparksScene
          tier={tier === 'none' ? 'mid' : tier}
          reduced={reduced}
          active={inView}
          delay={delay}
        />
      )}
    </div>
  );
}
