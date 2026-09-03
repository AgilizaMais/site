'use client';

import { useLayoutEffect, useRef } from 'react';
import { hero } from '@/lib/content/site';
import { gsap, registerGsap } from '@/lib/motion/gsap';
import { onSkipIntro } from '@/lib/motion/introBus';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';
import { HeroSparks } from './HeroSparks';

import photo from './assets/rafaelle.webp';

/**
 * A caixa da fotografia.
 *
 * No retrato a altura vem de `--hero-photo-h`, calculada a partir da base real
 * do bloco de texto (`useHeroFrame`). Reservar um valor fixo para o texto
 * encolhia a figura em qualquer aparelho cuja barra do navegador comesse mais
 * altura que a prevista. O fallback de 44svh só vale no primeiro quadro, antes
 * da medição.
 *
 * As duas camadas — a imagem e as faíscas que passam à frente dela —
 * compartilham exatamente este retângulo, e é por isso que ele é uma constante
 * e não duas listas de classes parecidas.
 */
const BOX =
  'absolute bottom-0 inset-x-0 mx-auto h-[var(--hero-photo-h,44svh)] md:inset-x-auto md:left-auto md:right-[2vw] md:mx-0 md:h-[88%]';

const ASPECT = { aspectRatio: `${photo.width} / ${photo.height}`, width: 'auto' } as const;

/** Quando ela começa a subir — a formação do cérebro termina em 2.3s. */
const RISE_DELAY = 2.3;
const RISE_DURATION = 1.4;

/** Quando a fotografia termina de subir, em segundos a partir da montagem. */
export const PHOTO_SETTLED = RISE_DELAY + RISE_DURATION;

export function HeroPhoto({ boxRef }: { boxRef: React.RefObject<HTMLDivElement | null> }) {
  const image = useRef<HTMLDivElement>(null);
  const { reduced, resolved } = useMotionPreference();

  /**
   * A entrada é do GSAP, e não do framer.
   *
   * O framer anima pela Web Animations API e, ao terminar, devolve o valor ao
   * estilo inline. Nessa troca havia um quadro em que a animação já tinha sido
   * removida e o estilo ainda dizia `opacity: 0` — a fotografia piscava,
   * invisível, por volta dos 4s. O GSAP escreve o estilo direto e não tem essa
   * entrega.
   *
   * O estado inicial é aplicado num layout effect, antes da primeira pintura:
   * assim não há flash, e sem JavaScript a fotografia simplesmente aparece.
   */
  useLayoutEffect(() => {
    const el = image.current;
    if (!el) return;
    registerGsap();
    gsap.set(el, { opacity: 0, yPercent: 9 });
  }, []);

  useLayoutEffect(() => {
    const el = image.current;
    if (!el || !resolved) return;
    registerGsap();

    if (reduced) {
      gsap.set(el, { opacity: 1, yPercent: 0 });
      return;
    }

    const tl = gsap.timeline({ delay: RISE_DELAY });
    tl.to(el, { opacity: 1, yPercent: 0, duration: RISE_DURATION, ease: 'outExpo' });
    const off = onSkipIntro(() => tl.totalProgress(1));

    return () => {
      off();
      tl.kill();
    };
  }, [reduced, resolved]);

  return (
    <>
      {/*
        Sobe da base só depois que o cérebro já tem forma. Entrar junto faria a
        cena disputar atenção consigo mesma.

        O transform aqui é seguro — ele desloca, não redimensiona; um `scale`
        faria o canvas irmão nascer com a caixa errada
        (docs/ARCHITECTURE.md §5, item 21).
      */}
      <div ref={image} className={`${BOX} pointer-events-none select-none`} style={ASPECT}>
        {/*
          `<img>` puro, e não `next/image`: com `output: export` as imagens já
          saem sem otimização, então o componente só acrescentaria runtime ao
          bundle. O import estático continua resolvendo o `basePath` sozinho —
          é o bundler que escreve a URL final.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.src}
          alt={hero.photoAlt}
          width={photo.width}
          height={photo.height}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain object-bottom"
        />
        {/*
          A base dissolve no fundo. Sem isso a foto termina numa aresta reta
          atravessando a tela, que é o oposto de integrar a figura ao cenário.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%]"
          style={{ background: 'linear-gradient(to top, var(--bg) 12%, transparent 100%)' }}
        />
      </div>

      <div ref={boxRef} className={`${BOX} pointer-events-none`} style={ASPECT}>
        <HeroSparks delay={PHOTO_SETTLED} />
      </div>
    </>
  );
}
