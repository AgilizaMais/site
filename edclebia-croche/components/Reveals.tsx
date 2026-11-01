'use client';

import { useEffect } from 'react';
import { gsap, registerGsap, ScrollTrigger } from '@/lib/motion/gsap';

/**
 * Revelações por scroll para todo o site:
 *  [data-reveal]       → sobe e aparece (em lote, com stagger)
 *  [data-reveal-lines] → linhas do título saem da máscara
 */
export function Reveals() {
  useEffect(() => {
    registerGsap();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 88%',
        once: true,
        onEnter: (els) =>
          gsap.to(els, { opacity: 1, y: 0, duration: 1.2, stagger: 0.09, ease: 'expo.out', overwrite: true }),
      });

      gsap.utils.toArray<HTMLElement>('[data-reveal-lines]').forEach((el) => {
        const lines = el.querySelectorAll('.line-mask > span');
        gsap.set(lines, { yPercent: 115 });
        ScrollTrigger.create({
          trigger: el,
          start: 'top 86%',
          once: true,
          onEnter: () => gsap.to(lines, { yPercent: 0, duration: 1.3, stagger: 0.08, ease: 'expo.out' }),
        });
      });
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    return () => {
      window.removeEventListener('load', refresh);
      ctx.revert();
    };
  }, []);
  return null;
}
