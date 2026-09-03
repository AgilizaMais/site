'use client';

import { useRef } from 'react';
import { m } from 'framer-motion';
import { hero, nextSceneHref } from '@/lib/content/site';
import { Eyebrow } from '@/components/typography/Eyebrow';
import { RevealLines } from '@/components/typography/RevealLines';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';
import { HeroCanvas } from './HeroCanvas';
import { HeroIndex } from './HeroIndex';
import { HeroIntro } from './HeroIntro';
import { HeroPhoto } from './HeroPhoto';
import { ScrollHint } from './ScrollHint';
import { useHeroFrame } from './useHeroFrame';

/**
 * CENA 1 — HERO · "Presença"
 *
 * Três camadas, nesta ordem de profundidade: o cérebro de partículas ao fundo,
 * a fotografia sobre ele, e faíscas do próprio contorno dela passando à frente
 * — é essa terceira que costura a figura ao cenário em vez de deixá-la colada
 * por cima.
 *
 * A entrada é encadeada: o cérebro se forma vindo de todos os lados, a
 * fotografia sobe da base, e só então o contorno acende.
 *
 * A copy vive no DOM e é legível sem WebGL e sem JS de animação.
 * Coreografia em docs/ANIMATION_SYSTEM.md §5.
 */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  const photoBox = useRef<HTMLDivElement>(null);
  const copyBlock = useRef<HTMLDivElement>(null);
  const frame = useHeroFrame(section, photoBox, copyBlock);

  const { reduced, resolved } = useMotionPreference();
  const d = (seconds: number) => (reduced ? 0 : seconds);
  // A entrada aguarda um quadro: sem isso, quem pediu movimento reduzido vê a
  // animação começar antes de a preferência ser lida.
  const enter = resolved ? { opacity: 1, y: 0 } : undefined;

  return (
    <section ref={section} id={hero.id} aria-labelledby="hero-title" className="relative overflow-hidden">
      <HeroIntro />

      <p className="sr-only">{hero.canvasDescription}</p>

      {/*
        O cérebro ocupa a cena inteira e passa por trás de tudo.

        Aqui NÃO pode haver transform de escala. O R3F mede o contêiner com
        getBoundingClientRect, que devolve a caixa já transformada: com um
        `scale` de entrada, o canvas nascia 8% maior que o pai e deslocado, e
        ficava assim, porque o ResizeObserver observa a caixa de layout, que
        não mudou. A aproximação de entrada acontece dentro do WebGL, na
        própria nuvem, onde não há o que medir.
      */}
      <m.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={resolved ? { opacity: 1 } : undefined}
        transition={{ duration: d(1.6), delay: d(0.5), ease: [0.65, 0, 0.35, 1] }}
      >
        <HeroCanvas frame={frame} />
      </m.div>

      <div className="relative z-10 flex min-h-[100svh] flex-col">
        {/* Palco: a fotografia é ancorada na base DESTA linha, então no
            desktop ela encosta no topo do índice sem número mágico nenhum. */}
        <div className="relative flex flex-1 items-start pt-[7svh] md:items-center md:pt-0">
          <HeroPhoto boxRef={photoBox} />

          <div className="relative z-10 mx-auto w-full max-w-content u-margin-x">
            <div ref={copyBlock} className="u-veil u-veil-hero relative max-w-[41rem]">
              <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={enter}
                transition={{ duration: d(0.7), delay: d(0.9), ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Único lugar da primeira tela onde o acento aparece fora
                    da headline — o traço ancora a coluna de texto. */}
                <div className="flex items-center gap-4">
                  <span aria-hidden className="block h-px w-10 bg-accent" />
                  <Eyebrow className="!text-accent">{hero.eyebrow}</Eyebrow>
                </div>
              </m.div>

              <RevealLines
                id="hero-title"
                as="h1"
                lines={hero.headline}
                accentFrom={hero.headlineAccentFrom}
                delay={d(1.05)}
                className="mt-5 font-display text-display-hero text-text md:mt-6"
              />

              <m.p
                initial={{ opacity: 0, y: 16 }}
                animate={enter}
                transition={{ duration: d(0.8), delay: d(1.4), ease: [0.16, 1, 0.3, 1] }}
                className="u-measure mt-6 text-body-l text-muted md:mt-7"
              >
                {hero.subheadline}
              </m.p>

              {/* Só no desktop: no celular o polegar já tem o gesto de rolar,
                  e um botão ali competiria com a própria rolagem. */}
              <m.div
                initial={{ opacity: 0, y: 14 }}
                animate={enter}
                transition={{ duration: d(0.8), delay: d(1.7), ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 hidden md:block"
              >
                <MagneticButton href={nextSceneHref('inicio')}>{hero.cta.label}</MagneticButton>
              </m.div>

              <ScrollHint className="mt-8 md:hidden" />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-content shrink-0 u-margin-x pb-8 md:pb-7">
          {/* A assinatura já está na navbar; repeti-la aqui só encheria a
              linha. Sobra o convite a rolar, sozinho. */}
          <ScrollHint className="mb-6 hidden md:flex" />

          <HeroIndex />
        </div>
      </div>
    </section>
  );
}
