'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ScreenQuad } from '@/components/canvas/ScreenQuad';
import { linesVert } from './shaders/lines.vert';
import { linesFrag } from './shaders/lines.frag';
import { GL_PALETTE } from '@/lib/theme/ThemeProvider';

type Props = {
  reduced: boolean;
  /** Fonte de verdade do progresso do scrub, escrita pelo ScrollTrigger. */
  progress: { value: number };
};

export function AnxietyLines({ reduced, progress }: Props) {
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const smoothed = useRef(reduced ? 1 : 0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: reduced ? 1 : 0 },
      uAspect: { value: 1 },
      uOpacity: { value: 0 },
      uColorLight: { value: new THREE.Color(GL_PALETTE.light) },
      uColorAccent: { value: new THREE.Color(GL_PALETTE.accent) },
      uGain: { value: GL_PALETTE.gain },
      uCurve: { value: GL_PALETTE.curve },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reduced],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: linesVert,
        fragmentShader: linesFrag,
        transparent: true,
        depthWrite: false,
        // O desenho é luz somada sobre o preto.
        blending: THREE.AdditiveBlending,
        uniforms,
      }),
    [uniforms],
  );

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    uniforms.uAspect.value = size.width / size.height;
    if (reduced) {
      uniforms.uOpacity.value = 1;
      invalidate();
    }
  }, [size, reduced, uniforms, invalidate]);

  useFrame((_, delta) => {
    if (reduced) return;
    uniforms.uTime.value += delta;
    uniforms.uAspect.value = size.width / size.height;

    // O scrub do ScrollTrigger já é suavizado, mas a roda do mouse entrega
    // saltos. Este lerp garante que a sincronização das linhas seja sempre
    // gradual — o oposto do que a cena quer dizer seria um pulo.
    smoothed.current = THREE.MathUtils.damp(smoothed.current, progress.value, 6, delta);
    uniforms.uProgress.value = smoothed.current;

    // Entrada suave: as linhas surgem do preto em vez de aparecerem prontas.
    uniforms.uOpacity.value = THREE.MathUtils.damp(uniforms.uOpacity.value, 1, 3, delta);
  });

  return <ScreenQuad material={material} />;
}
