/**
 * Curvas do sistema. Definidas uma única vez.
 * Proibidos: back, elastic, bounce e linear (exceto scrub e loops de shader).
 * docs/ANIMATION_SYSTEM.md §2
 */
export const EASE = {
  outExpo: [0.16, 1, 0.3, 1],
  cine: [0.65, 0, 0.35, 1],
  outSoft: [0.25, 1, 0.5, 1],
  inQuiet: [0.55, 0, 1, 0.45],
} as const satisfies Record<string, readonly [number, number, number, number]>;

type Cubic = readonly [number, number, number, number];

/** Formato aceito pelo GSAP: "0.16,1,0.3,1" via CustomEase, ou string cubic-bezier no CSS. */
export const cssEase = (e: Cubic) => `cubic-bezier(${e.join(', ')})`;

/** Framer Motion aceita o array diretamente; este alias existe só para legibilidade. */
export const fmEase = (e: Cubic) => [...e] as [number, number, number, number];
