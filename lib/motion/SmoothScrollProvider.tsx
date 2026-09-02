'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { registerGsap, gsap, ScrollTrigger } from './gsap';
import { useMotionPreference } from './MotionPreferenceProvider';

/**
 * Um único rAF no site inteiro: o ticker do GSAP dirige o Lenis e o ScrollTrigger.
 * No modo reduzido, o Lenis nem é instanciado — o scroll nativo assume.
 * docs/ANIMATION_SYSTEM.md §4
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const { reduced } = useMotionPreference();

  useEffect(() => {
    registerGsap();
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Em touch o scroll nativo é melhor: mantém o momentum do sistema.
      syncTouch: false,
      touchMultiplier: 1.6,
    });

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    lenis.on('scroll', ScrollTrigger.update);

    // Âncoras internas passam pelo Lenis para manter o mesmo easing.
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest('a[href^="#"]');
      const href = el?.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: 0, duration: 1.4 });
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [reduced]);

  return <>{children}</>;
}
