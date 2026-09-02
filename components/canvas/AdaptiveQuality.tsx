'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

/**
 * Degradação adaptativa: média móvel de FPS em janela de 60 frames.
 * Abaixo de 50 FPS por ~2s, o DPR cai uma vez. Nunca sobe de volta na
 * mesma sessão — oscilar é pior do que ficar um degrau abaixo.
 * docs/ARCHITECTURE.md §4
 */
export function AdaptiveQuality({ minDpr = 1 }: { minDpr?: number }) {
  const gl = useThree((s) => s.gl);
  const frames = useRef(0);
  const elapsed = useRef(0);
  const slowFor = useRef(0);
  const degraded = useRef(false);

  useFrame((_, delta) => {
    if (degraded.current) return;
    frames.current += 1;
    elapsed.current += delta;

    if (frames.current < 60) return;

    const fps = frames.current / elapsed.current;
    slowFor.current = fps < 50 ? slowFor.current + elapsed.current : 0;
    frames.current = 0;
    elapsed.current = 0;

    if (slowFor.current >= 2) {
      const next = Math.max(minDpr, gl.getPixelRatio() - 0.5);
      if (next < gl.getPixelRatio()) gl.setPixelRatio(next);
      degraded.current = true;
    }
  });

  return null;
}
