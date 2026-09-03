'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * Onde o cérebro fica, medido no layout — e não em frações fixas da tela.
 *
 * O cérebro pertence a ELA: fica atrás da cabeça, e do tamanho da fotografia.
 * Enquadrá-lo por porcentagem do viewport funciona num aparelho e quebra no
 * seguinte, porque a coluna de texto ocupa uma fatia diferente da tela em cada
 * altura — num celular curto o texto desce até onde a nuvem começa, e o
 * convite a rolar acaba em cima das partículas mais claras.
 *
 * Tudo aqui é normalizado pela caixa da seção: o valor não muda quando a barra
 * do navegador recolhe, e o WebGL só precisa multiplicar pelo viewport dele.
 */
export type HeroFrame = {
  /** Centro do objeto, em fração da largura e da altura da seção. */
  cx: number;
  cy: number;
  /** Largura do objeto, em fração da largura da seção. */
  w: number;
  /**
   * O objeto nunca sobe acima disto — a base do bloco de texto. Zero quando
   * não há teto, que é o caso do desktop: lá o texto fica AO LADO da
   * fotografia, e limitar a altura da nuvem pela base dele a empurraria para
   * fora da tela.
   */
  ceiling: number;
};

const FALLBACK: HeroFrame = { cx: 0.5, cy: 0.68, w: 0.9, ceiling: 0.5 };

/** Folga para decidir se as duas colunas de fato não se cruzam. */
const SIDE_BY_SIDE_SLACK = 8;

/** Quantiza para não reamostrar a nuvem a cada pixel de resize. */
const q = (n: number) => Math.round(n * 200) / 200;

export function useHeroFrame(
  section: RefObject<HTMLElement | null>,
  photo: RefObject<HTMLElement | null>,
  copy: RefObject<HTMLElement | null>,
): HeroFrame {
  const [frame, setFrame] = useState<HeroFrame>(FALLBACK);

  useLayoutEffect(() => {
    const measure = () => {
      const s = section.current?.getBoundingClientRect();
      const p = photo.current?.getBoundingClientRect();
      const c = copy.current?.getBoundingClientRect();
      if (!s || !p || !c || s.width === 0 || s.height === 0) return;

      // Empilhado (retrato) ou lado a lado (desktop)? A pergunta é geométrica,
      // não de breakpoint: quem responde é o layout que de fato aconteceu.
      const sideBySide =
        c.right <= p.left + SIDE_BY_SIDE_SLACK || p.right <= c.left + SIDE_BY_SIDE_SLACK;

      setFrame((prev) => {
        const next: HeroFrame = {
          cx: q((p.left - s.left + p.width / 2) / s.width),
          // A cabeça dela fica no primeiro terço da fotografia; é ali que o
          // centro da nuvem tem de cair para o desenho emoldurar o rosto.
          cy: q((p.top - s.top + p.height * 0.385) / s.height),
          w: q((p.width * 1.28) / s.width),
          ceiling: sideBySide ? 0 : q((c.bottom - s.top) / s.height),
        };
        return prev.cx === next.cx && prev.cy === next.cy && prev.w === next.w && prev.ceiling === next.ceiling
          ? prev
          : next;
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (section.current) ro.observe(section.current);
    if (photo.current) ro.observe(photo.current);
    if (copy.current) ro.observe(copy.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [section, photo, copy]);

  return frame;
}
