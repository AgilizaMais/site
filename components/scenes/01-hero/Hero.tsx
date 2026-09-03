'use client';

import { m } from 'framer-motion';
import { hero, nextSceneHref, professional } from '@/lib/content/site';
import { RevealLines } from '@/components/typography/RevealLines';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';
import { HeroCanvas } from './HeroCanvas';
import { HeroIntro } from './HeroIntro';
import { ScrollHint } from './ScrollHint';

/**
 * CENA 1 — HERO · "Presença"
 * A copy vive no DOM e é legível sem WebGL e sem JS de animação.
 * Coreografia da entrada em docs/ANIMATION_SYSTEM.md §5.
 */
export function Hero() {
  const { reduced, resolved } = useMotionPreference();
  const d = (seconds: number) => (reduced ? 0 : seconds);
  // A entrada aguarda um quadro: sem isso, quem pediu movimento reduzido vê a
  // animação começar antes de a preferência ser lida.
  const enter = resolved ? { opacity: 1, scale: 1, y: 0 } : undefined;

  return (
    <section
      id={hero.id}
      aria-labelledby="hero-title"
      data-snap="start"
      className="relative flex min-h-[100svh] flex-col overflow-hidden"
    >
      <HeroIntro />

      <p className="sr-only">{hero.canvasDescription}</p>

      {/*
        O objeto ocupa a cena inteira e passa por trás do texto.

        Aqui NÃO pode haver transform. O R3F mede o contêiner com
        getBoundingClientRect, que devolve a caixa já transformada: com um
        `scale` de entrada, o canvas nascia 8% maior que o pai e deslocado
        para a direita — e ficava assim, porque o ResizeObserver observa a
        caixa de layout, que não mudou. Só um resize de verdade (a barra do
        navegador recolhendo, no primeiro gesto de scroll) corrigia.

        A aproximação de entrada mudou de lugar: agora acontece dentro do
        WebGL, na própria nuvem (`HeroParticles`), onde não há o que medir.
      */}
      <m.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={resolved ? { opacity: 1 } : undefined}
        transition={{ duration: d(1.6), delay: d(0.7), ease: [0.65, 0, 0.35, 1] }}
      >
        <HeroCanvas />
      </m.div>

      <div className="relative z-10 mx-auto flex w-full max-w-content flex-1 items-end pt-[46svh] u-margin-x md:items-center md:pt-0">
        <div className="u-veil relative w-full max-w-[40rem]">
          <RevealLines
            id="hero-title"
            as="h1"
            lines={hero.headline}
            delay={d(1.05)}
            className="font-display text-display-xl text-text"
          />

          <m.p
            initial={{ opacity: 0, y: 16 }}
            animate={enter}
            transition={{ duration: d(0.8), delay: d(1.35), ease: [0.16, 1, 0.3, 1] }}
            className="u-measure mt-7 text-body-l text-muted"
          >
            {hero.subheadline}
          </m.p>

          <m.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={enter}
            transition={{ duration: d(0.8), delay: d(1.55), ease: [0.16, 1, 0.3, 1] }}
            className="mt-11"
          >
            <MagneticButton href={nextSceneHref('inicio')}>{hero.cta.label}</MagneticButton>
          </m.div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-content shrink-0 items-end justify-between pb-8 pt-12 u-margin-x md:pt-8">
        <ScrollHint />
        <m.p
          initial={{ opacity: 0 }}
          animate={enter}
          transition={{ duration: d(0.8), delay: d(1.8) }}
          className="u-tabular hidden font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted md:block"
        >
          {professional.role} · {professional.crp}
        </m.p>
      </div>
    </section>
  );
}
