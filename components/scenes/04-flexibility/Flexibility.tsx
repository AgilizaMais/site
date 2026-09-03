'use client';

import { useLayoutEffect, useRef } from 'react';
import { flexibility } from '@/lib/content/site';
import { Eyebrow } from '@/components/typography/Eyebrow';
import { RevealLines } from '@/components/typography/RevealLines';
import { gsap, registerGsap, ScrollTrigger } from '@/lib/motion/gsap';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';
import { FlexibilityCanvas } from './FlexibilityCanvas';

/**
 * CENA 4 — FLEXIBILIDADE PSICOLÓGICA · "Dobrar"
 *
 * Uma fita larga atravessa a tela. Ao longo do trilho ela se torce, se dobra
 * sobre si mesma, absorve o movimento e volta a correr contínua. Em nenhum
 * quadro ela se parte — a geometria é gerada a partir de uma curva contínua,
 * então romper é literalmente impossível ali.
 *
 * É o contraponto exato da Cena 2: lá o excesso de movimento vira alarme e
 * precisa desacelerar; aqui o movimento é atravessado e absorvido.
 *
 * O objeto fica preso por `position: sticky`, como nas cenas anteriores: sem
 * pin-spacer, sem recálculo de layout a cada refresh.
 */
export function Flexibility() {
  const track = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const progress = useRef({ value: 0 });
  const { reduced, resolved } = useMotionPreference();

  useLayoutEffect(() => {
    const trackEl = track.current;
    const copyEl = copy.current;
    if (!trackEl || !copyEl || !resolved) return;

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

      // Torção → dobra → continuidade. O shader lê este valor.
      tl.to(progress.current, { value: 1, duration: 1, ease: 'none' }, 0);

      // A frase entra quando a fita já mostrou que aguenta a dobra. Dizer
      // antes seria promessa; dizer depois é constatação.
      tl.to(
        lines,
        {
          clipPath: 'inset(0 0 0% 0)',
          yPercent: 0,
          opacity: 1,
          duration: 0.1,
          stagger: 0.035,
          ease: 'power2.out',
        },
        0.68,
      );
      tl.to(rest, { opacity: 1, y: 0, duration: 0.09, stagger: 0.025, ease: 'power2.out' }, 0.72);
    }, trackEl);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [reduced, resolved]);

  return (
    <section id={flexibility.id} aria-labelledby="flexibility-title" className="relative">
      <p className="sr-only">{flexibility.canvasDescription}</p>

      <div ref={track} data-snap="end" className="u-scroll-track h-[300svh]">
        <div className="u-scroll-sticky sticky top-0 flex h-[100svh] items-center overflow-hidden">
          <FlexibilityCanvas progress={progress.current} />

          <div className="relative z-10 mx-auto w-full max-w-content u-margin-x">
            <div ref={copy} className="u-veil u-veil-right relative max-w-[42rem] md:ml-auto md:text-right">
              <Eyebrow data-copy-rest>{flexibility.eyebrow}</Eyebrow>
              <RevealLines
                id="flexibility-title"
                as="h2"
                lines={flexibility.headline}
                play={false}
                className="mt-6 font-display text-display-m text-text"
              />
              <p data-copy-rest className="u-measure mt-7 text-body-l text-muted md:ml-auto">
                {flexibility.body}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
