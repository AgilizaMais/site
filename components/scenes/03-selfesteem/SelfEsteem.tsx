'use client';

import { useEffect, useRef } from 'react';
import { selfEsteem } from '@/lib/content/site';
import { Eyebrow } from '@/components/typography/Eyebrow';
import { RevealLines } from '@/components/typography/RevealLines';
import { gsap, registerGsap, ScrollTrigger } from '@/lib/motion/gsap';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';
import { usePointerFine } from '@/lib/hooks/usePointerFine';
import { SelfEsteemCanvas } from './SelfEsteemCanvas';
import type { PanelRect } from './GlassPanel';

/**
 * CENA 3 — AUTOESTIMA · "Reencontrar"
 *
 * Um painel translúcido sobre um campo de luz. O que passa por ele chega
 * deslocado e desfocado; parado o movimento, a imagem volta ao lugar.
 *
 * Não é um espelho — espelho devolve; este painel filtra. A distorção é
 * sempre reversível, e é essa reversibilidade que carrega a ideia.
 *
 * O retângulo do painel é medido no DOM e enviado ao shader: o layout é a
 * fonte da verdade, então o vidro nunca sai do lugar em nenhum viewport.
 */
export function SelfEsteem() {
  const section = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);

  const rect = useRef<PanelRect>({ cx: 0.66, cy: 0.5, hx: 0.12, hy: 0.2, radius: 0.02 });
  const drive = useRef(0);
  const pointer = useRef({ x: 0.5, y: 0.5 });

  const { reduced, resolved } = useMotionPreference();
  const fine = usePointerFine();

  // --- Medição do painel, em UV do canvas.
  useEffect(() => {
    const measure = () => {
      const sectionEl = section.current;
      const panelEl = panel.current;
      if (!sectionEl || !panelEl) return;

      const s = sectionEl.getBoundingClientRect();
      const p = panelEl.getBoundingClientRect();
      if (s.width === 0 || s.height === 0) return;

      rect.current = {
        cx: (p.left - s.left + p.width / 2) / s.width,
        // O UV do WebGL cresce para cima; o do DOM, para baixo.
        cy: 1 - (p.top - s.top + p.height / 2) / s.height,
        hx: p.width / 2 / s.width,
        hy: p.height / 2 / s.height,
        radius: 28 / s.height,
      };
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (section.current) ro.observe(section.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // --- O que aciona a distorção.
  useEffect(() => {
    if (reduced || !resolved) {
      drive.current = 0;
      return;
    }

    const sectionEl = section.current;
    if (!sectionEl) return;

    let idleTimer = 0;
    const panelEl = panel.current;
    let appliedBlur = -1;

    /** O vidro sempre desfoca; o cursor só aumenta o distúrbio. */
    const applyBlur = (value: number) => {
      const blur = 7 + value * 7;
      if (panelEl && Math.abs(blur - appliedBlur) > 0.25) {
        panelEl.style.setProperty('--glass-blur', `${blur.toFixed(1)}px`);
        appliedBlur = blur;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const s = sectionEl.getBoundingClientRect();
      pointer.current.x = (e.clientX - s.left) / s.width;
      pointer.current.y = 1 - (e.clientY - s.top) / s.height;
      drive.current = 1;
      applyBlur(1);

      // Sete décimos de segundo parado e a imagem começa a voltar ao lugar.
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        drive.current = 0;
        applyBlur(0);
      }, 700);
    };

    /**
     * No toque não há cursor: quem perturba a imagem é a velocidade do
     * próprio scroll. A leitura é a mesma — o movimento distorce, a pausa
     * devolve.
     */
    let lastY = window.scrollY;
    let lastT = performance.now();
    const onScroll = () => {
      const now = performance.now();
      const dt = Math.max(16, now - lastT);
      const v = Math.abs(window.scrollY - lastY) / dt;
      lastY = window.scrollY;
      lastT = now;

      const value = Math.min(1, v / 2.2);
      drive.current = value;
      applyBlur(value);

      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        drive.current = 0;
        applyBlur(0);
      }, 700);
    };

    if (fine) {
      sectionEl.addEventListener('pointermove', onPointerMove);
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    return () => {
      window.clearTimeout(idleTimer);
      sectionEl.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, [fine, reduced, resolved]);

  // --- Entrada da copy.
  useEffect(() => {
    const copyEl = copy.current;
    if (!copyEl || !resolved) return;
    registerGsap();

    const ctx = gsap.context(() => {
      const lines = copyEl.querySelectorAll('[data-line-inner]');
      const rest = copyEl.querySelectorAll('[data-copy-rest]');

      if (reduced) {
        gsap.set([lines, rest], { clipPath: 'inset(0 0 0% 0)', yPercent: 0, opacity: 1 });
        return;
      }

      gsap.set(lines, { clipPath: 'inset(0 0 100% 0)', yPercent: 34, opacity: 0 });
      gsap.set(rest, { opacity: 0, y: 16 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: copyEl, start: 'top 78%', once: true },
      });
      tl.to(lines, {
        clipPath: 'inset(0 0 0% 0)',
        yPercent: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.09,
        ease: 'outExpo',
      });
      tl.to(rest, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, ease: 'outExpo' }, 0.2);
    }, copyEl);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [reduced, resolved]);

  return (
    <section
      ref={section}
      id={selfEsteem.id}
      aria-labelledby="selfesteem-title"
      data-snap="start"
      className="relative flex min-h-[100svh] items-center overflow-hidden py-24 md:py-0"
    >
      <p className="sr-only">{selfEsteem.canvasDescription}</p>

      <SelfEsteemCanvas rect={rect} drive={drive} pointer={pointer} />

      {/* O painel de vidro é DOM: assim o desfoque atinge de fato o texto que
          fica atrás dele, coisa que o WebGL não alcança. */}
      <div
        ref={panel}
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[16%] h-[38svh] w-[68vw] -translate-x-1/2 rounded-[28px] border border-glass-edge md:left-auto md:right-[8vw] md:top-1/2 md:h-[58svh] md:w-[min(34vw,26rem)] md:-translate-x-0 md:-translate-y-1/2"
        style={{
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ['--glass-blur' as any]: '7px',
          backdropFilter: 'blur(var(--glass-blur)) saturate(115%)',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(115%)',
          backgroundColor: 'rgba(24,24,27,0.28)',
          transition: 'backdrop-filter 220ms linear',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-content u-margin-x">
        <div ref={copy} className="u-veil relative mt-[46svh] max-w-[46rem] md:mt-0">
          <Eyebrow data-copy-rest>{selfEsteem.eyebrow}</Eyebrow>
          <RevealLines
            id="selfesteem-title"
            as="h2"
            lines={selfEsteem.headline}
            play={false}
            className="mt-6 font-display text-display-m text-text"
          />
          <p data-copy-rest className="u-measure mt-7 text-body-l text-muted">
            {selfEsteem.body}
          </p>
        </div>
      </div>
    </section>
  );
}
