'use client';

import { useLayoutEffect, useRef } from 'react';
import { anxiety } from '@/lib/content/site';
import { Eyebrow } from '@/components/typography/Eyebrow';
import { RevealLines } from '@/components/typography/RevealLines';
import { gsap, registerGsap, ScrollTrigger } from '@/lib/motion/gsap';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';
import { AnxietyCanvas } from './AnxietyCanvas';

/**
 * CENA 2 — ANSIEDADE · "Sincronizar"
 *
 * O visitante primeiro sente, depois lê. As linhas atravessam o caos, a
 * desaceleração e a sincronia ao longo de um trilho de 250svh; só nos últimos
 * 14% do percurso a copy entra.
 *
 * O objeto fica preso por `position: sticky`, e não pelo `pin` do ScrollTrigger:
 * sticky não cria pin-spacer, não recalcula layout a cada refresh e convive com
 * o Lenis sem ajuste. O ScrollTrigger aqui só escreve o progresso.
 *
 * Coreografia em docs/ANIMATION_SYSTEM.md §5.
 */
export function Anxiety() {
  const track = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const progress = useRef({ value: 0 });
  const { reduced } = useMotionPreference();

  useLayoutEffect(() => {
    const trackEl = track.current;
    const copyEl = copy.current;
    if (!trackEl || !copyEl) return;

    registerGsap();

    const ctx = gsap.context(() => {
      const lines = copyEl.querySelectorAll('[data-line-inner]');
      const rest = copyEl.querySelectorAll('[data-copy-rest]');

      if (reduced) {
        progress.current.value = 1;
        gsap.set([lines, rest], { clipPath: 'inset(0 0 0% 0)', yPercent: 0, opacity: 1 });
        return;
      }

      gsap.set(lines, { clipPath: 'inset(0 0 100% 0)', yPercent: 34, opacity: 0 });
      gsap.set(rest, { opacity: 0, y: 16 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: trackEl,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });

      // Caos → desaceleração → sincronia. O shader lê este valor.
      tl.to(progress.current, { value: 1, duration: 1, ease: 'none' }, 0);

      // A copy só existe depois que as linhas encontram o equilíbrio.
      tl.to(
        lines,
        {
          clipPath: 'inset(0 0 0% 0)',
          yPercent: 0,
          opacity: 1,
          duration: 0.09,
          stagger: 0.03,
          ease: 'power2.out',
        },
        0.9,
      );
      tl.to(rest, { opacity: 1, y: 0, duration: 0.08, stagger: 0.02, ease: 'power2.out' }, 0.93);
    }, trackEl);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section id={anxiety.id} aria-labelledby="anxiety-title" className="relative">
      <p className="sr-only">{anxiety.canvasDescription}</p>

      <div ref={track} className="u-scroll-track h-[380svh]">
        <div className="u-scroll-sticky sticky top-0 flex h-[100svh] items-center overflow-hidden">
          <AnxietyCanvas progress={progress.current} />

          <div className="relative z-10 mx-auto w-full max-w-content u-margin-x">
            <div ref={copy} className="u-veil relative max-w-[44rem]">
              <Eyebrow data-copy-rest>{anxiety.eyebrow}</Eyebrow>
              <RevealLines
                id="anxiety-title"
                as="h2"
                lines={anxiety.headline}
                play={false}
                className="mt-6 font-display text-display-m text-text"
              />
              <p data-copy-rest className="u-measure mt-7 text-body-l text-muted">
                {anxiety.body}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
