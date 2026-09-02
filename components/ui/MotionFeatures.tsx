'use client';

import { LazyMotion, domAnimation } from 'framer-motion';

/**
 * Carrega apenas o subconjunto de features que o site usa (transform/opacity).
 * Corta ~30 KB gz do first-load em relação ao bundle completo do Framer Motion.
 * Todo componente animado usa <m.*>, nunca <motion.*> — `strict` garante isso.
 */
export function MotionFeatures({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
