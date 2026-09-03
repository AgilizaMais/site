'use client';

import { useScrollSnap } from '@/lib/motion/useScrollSnap';

/** Ativa a pausa suave nos pontos de leitura. Não renderiza nada. */
export function ScrollSnap() {
  useScrollSnap();
  return null;
}
