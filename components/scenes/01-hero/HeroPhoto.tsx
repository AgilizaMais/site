'use client';

import { m } from 'framer-motion';
import { hero } from '@/lib/content/site';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';
import { HeroSparks } from './HeroSparks';

import photo from './assets/rafaelle.webp';

/**
 * A caixa da fotografia.
 *
 * No retrato a altura é o menor entre 44% da tela e o que sobra depois da
 * coluna de texto (30rem cobre título, parágrafo e convite no pior caso de
 * quebra). Altura fixa colide com o texto em telas curtas — num 360×740 a
 * fotografia subia por cima do convite a rolar. As duas camadas — a imagem e as faíscas que passam
 * à frente dela — compartilham exatamente este retângulo, e é por isso que ele
 * é uma constante e não duas listas de classes parecidas.
 *
 * O aspecto vem do arquivo, então a altura manda e a largura acompanha: assim
 * a caixa das faíscas coincide com a imagem sem nenhuma medição em runtime.
 */
/**
 * A centralização no celular é por margem automática, nunca por `translate`:
 * a animação de entrada escreve um `transform` inline, que sobrescreveria a
 * classe de deslocamento e jogaria a foto meia largura para a direita — com
 * as faíscas, que não são animadas, ficando no lugar certo e denunciando o
 * desencontro.
 */
const BOX =
  'absolute bottom-0 inset-x-0 mx-auto h-[max(9rem,min(44svh,100svh_-_30rem))] md:inset-x-auto md:left-auto md:right-[2vw] md:mx-0 md:h-[92%]';

const ASPECT = { aspectRatio: `${photo.width} / ${photo.height}`, width: 'auto' } as const;

/** Quando a fotografia termina de subir, em segundos a partir da montagem. */
export const PHOTO_SETTLED = 2.9;

export function HeroPhoto({ boxRef }: { boxRef: React.RefObject<HTMLDivElement | null> }) {
  const { reduced, resolved } = useMotionPreference();
  const d = (seconds: number) => (reduced ? 0 : seconds);

  return (
    <>
      {/*
        Sobe da base depois que o cérebro se forma. O transform aqui é seguro
        — ele desloca, não redimensiona; um `scale` faria o canvas irmão
        nascer com a caixa errada (docs/ARCHITECTURE.md §5, item 21).
      */}
      <m.div
        className={`${BOX} pointer-events-none select-none`}
        style={ASPECT}
        initial={{ opacity: 0, y: '9%' }}
        animate={resolved ? { opacity: 1, y: '0%' } : undefined}
        transition={{ duration: d(1.3), delay: d(1.9), ease: [0.16, 1, 0.3, 1] }}
      >
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
      </m.div>

      <div ref={boxRef} className={`${BOX} pointer-events-none`} style={ASPECT}>
        <HeroSparks delay={PHOTO_SETTLED} />
      </div>
    </>
  );
}
