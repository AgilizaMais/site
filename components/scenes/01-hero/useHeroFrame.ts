'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * Enquadramento da primeira tela, medido no layout — e não em frações fixas
 * da tela.
 *
 * Duas coisas saem daqui:
 *
 * 1. **A altura da fotografia no retrato**, escrita como custom property. Antes
 *    era `min(44svh, 100svh - 30rem)`, onde as 30rem eram um chute do espaço
 *    que o texto ia ocupar. Num aparelho com a barra do navegador comendo
 *    altura o chute sobrava, a figura encolhia para menos de 30% da tela e
 *    ficava uma faixa vazia enorme entre o texto e ela. A conta agora usa a
 *    base real do bloco de texto.
 *
 * 2. **Onde o cérebro fica.** Ele pertence a ELA: centro, tamanho e teto saem
 *    da caixa da fotografia. Enquadrá-lo por porcentagem do viewport funciona
 *    num aparelho e quebra no seguinte, porque a coluna de texto ocupa uma
 *    fatia diferente da tela em cada altura.
 *
 * O que vai para o WebGL é normalizado pela caixa da seção: não muda quando a
 * barra do navegador recolhe, e o shader só multiplica pelo viewport dele.
 */
export type HeroFrame = {
  /** Centro do objeto, em fração da largura e da altura da seção. */
  cx: number;
  cy: number;
  /** Largura do objeto, em fração da largura da seção. */
  w: number;
  /**
   * O objeto nunca sobe acima disto.
   *
   * Empilhado, é a base do bloco de texto. Lado a lado, é a base da navbar —
   * usar a base do texto ali empurraria a nuvem para fora da tela, já que o
   * texto ocupa a coluna inteira.
   */
  ceiling: number;
};

const FALLBACK: HeroFrame = { cx: 0.5, cy: 0.66, w: 1.05, ceiling: 0.5 };

/** Folga para decidir se as duas colunas de fato não se cruzam. */
const SIDE_BY_SIDE_SLACK = 8;

/**
 * Respiro entre a base do texto e o topo da fotografia, no retrato.
 *
 * Não é margem estética: é exatamente a faixa em que a borda de cima do
 * cérebro aparece. Zero aqui esconde a nuvem inteira atrás dela.
 */
const BREATH = 80;

/** Teto e piso da altura da fotografia. */
const MAX_PHOTO_RATIO = 0.58;
const MIN_PHOTO = 150;

/**
 * Largura do cérebro em relação à dela, e onde o centro da nuvem cai dentro da
 * fotografia. `0.30` põe o centro na altura da testa: é o que faz a nuvem
 * emoldurar o rosto em vez de nascer atrás dos ombros.
 */
const BRAIN_SPAN = 1.5;
const BRAIN_ANCHOR = 0.2;

/**
 * Teto da largura do cérebro, em fração da largura da seção. Num celular alto
 * a fotografia fica grande, e 1.42× dela estourava as duas bordas da tela: a
 * nuvem virava uma faixa cortada, não um objeto.
 */
const BRAIN_MAX_SPAN = 1.22;
// Um pouco além da largura da tela é sangria, não corte: a nuvem passa das
// bordas como um objeto grande demais para o quadro, que é o efeito procurado.

/**
 * Altura da navbar mais uma folga. No desktop é ela quem faz o teto: sem
 * isso a nuvem sobe até o topo da tela e as partículas mais claras passam por
 * trás do nome e do controle de movimento, que ficam ilegíveis em cima delas.
 */
const NAVBAR_CLEAR = 76;

/** Quantiza para não reamostrar a nuvem a cada pixel de resize. */
const q = (n: number) => Math.round(n * 200) / 200;

export function useHeroFrame(
  section: RefObject<HTMLElement | null>,
  stage: RefObject<HTMLElement | null>,
  photo: RefObject<HTMLElement | null>,
  copy: RefObject<HTMLElement | null>,
): HeroFrame {
  const [frame, setFrame] = useState<HeroFrame>(FALLBACK);

  useLayoutEffect(() => {
    const measure = () => {
      const sectionEl = section.current;
      const s = sectionEl?.getBoundingClientRect();
      const g = stage.current?.getBoundingClientRect();
      const p = photo.current?.getBoundingClientRect();
      const c = copy.current?.getBoundingClientRect();
      if (!sectionEl || !s || !g || !p || !c || s.width === 0 || s.height === 0) return;

      // Empilhado (retrato) ou lado a lado (desktop)? A pergunta é geométrica,
      // não de breakpoint: quem responde é o layout que de fato aconteceu.
      const sideBySide =
        c.right <= p.left + SIDE_BY_SIDE_SLACK || p.right <= c.left + SIDE_BY_SIDE_SLACK;

      if (sideBySide) {
        sectionEl.style.removeProperty('--hero-photo-h');
      } else {
        const height = Math.max(
          MIN_PHOTO,
          Math.min(g.height * MAX_PHOTO_RATIO, g.bottom - c.bottom - BREATH),
        );
        sectionEl.style.setProperty('--hero-photo-h', `${Math.round(height)}px`);
      }

      setFrame((prev) => {
        const next: HeroFrame = {
          cx: q((p.left - s.left + p.width / 2) / s.width),
          cy: q((p.top - s.top + p.height * BRAIN_ANCHOR) / s.height),
          w: q(Math.min((p.width * BRAIN_SPAN) / s.width, BRAIN_MAX_SPAN)),
          ceiling: q((sideBySide ? NAVBAR_CLEAR : c.bottom - s.top) / s.height),
        };
        return prev.cx === next.cx &&
          prev.cy === next.cy &&
          prev.w === next.w &&
          prev.ceiling === next.ceiling
          ? prev
          : next;
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    for (const ref of [section, stage, photo, copy]) {
      if (ref.current) ro.observe(ref.current);
    }
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [section, stage, photo, copy]);

  return frame;
}
