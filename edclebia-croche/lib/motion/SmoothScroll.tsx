'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, registerGsap, ScrollTrigger } from './gsap';
import { scrollBus, setScroller } from './bus';

/**
 * Um único rAF: o ticker do GSAP dirige o Lenis e o ScrollTrigger.
 * Com movimento reduzido o Lenis nem nasce — o scroll nativo assume.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerGsap();
    const html = document.documentElement;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      html.classList.add('reduced');
      const onScroll = () => scrollBus.emit({ y: window.scrollY, velocity: 0, direction: 1 });
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.4,
    });

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    lenis.on('scroll', (l: Lenis) => {
      ScrollTrigger.update();
      scrollBus.emit({ y: l.scroll, velocity: l.velocity * 60, direction: l.direction });
    });

    setScroller((target, opts) => {
      lenis.scrollTo(target, { offset: opts?.offset ?? 0, duration: 1.5 });
    });

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest('a[href^="#"]');
      const href = a?.getAttribute('href');
      if (!href || href === '#') return;
      const el = document.querySelector(href);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement, { offset: 0, duration: 1.5 });
      history.replaceState(null, '', href);
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      gsap.ticker.remove(raf);
      setScroller(null);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
