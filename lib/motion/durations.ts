/** Tokens de duração, em segundos (GSAP) e milissegundos (CSS/Framer). */
export const D = {
  micro: 0.12,
  fast: 0.24,
  base: 0.48,
  slow: 0.8,
  cine: 1.4,
  breath: 4,
} as const;

export const MS = {
  micro: 120,
  fast: 240,
  base: 480,
  slow: 800,
  cine: 1400,
  breath: 4000,
} as const;

/** Stagger padrão por contexto (docs/ANIMATION_SYSTEM.md §2). */
export const STAGGER = {
  lines: 0.09,
  words: 0.035,
  cards: 0.11,
  items: 0.07,
} as const;
