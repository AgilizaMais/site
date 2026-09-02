'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ScreenQuad } from '@/components/canvas/ScreenQuad';
import { linesVert } from '@/components/scenes/02-anxiety/shaders/lines.vert';
import { glassFrag } from './shaders/glass.frag';

export type PanelRect = { cx: number; cy: number; hx: number; hy: number; radius: number };

type Props = {
  reduced: boolean;
  /** Retângulo do painel em UV, medido no DOM — a fonte da verdade é o layout. */
  rect: { current: PanelRect };
  /** Intensidade desejada da distorção, escrita pelo componente da cena. */
  drive: { current: number };
  /** Posição do ponteiro em UV. */
  pointer: { current: { x: number; y: number } };
};

export function GlassPanel({ reduced, rect, drive, pointer }: Props) {
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uStrength: { value: 0 },
      uOpacity: { value: 0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uPanelCenter: { value: new THREE.Vector2(0.66, 0.5) },
      uPanelHalf: { value: new THREE.Vector2(0.12, 0.2) },
      uRadius: { value: 0.02 },
      uColorLight: { value: new THREE.Color('#fff8f1') },
      uColorAccent: { value: new THREE.Color('#f97316') },
    }),
    [],
  );

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: linesVert,
        fragmentShader: glassFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms,
      }),
    [uniforms],
  );

  useEffect(() => () => material.dispose(), [material]);

  const applyRect = () => {
    const r = rect.current;
    uniforms.uPanelCenter.value.set(r.cx, r.cy);
    uniforms.uPanelHalf.value.set(r.hx, r.hy);
    uniforms.uRadius.value = r.radius;
    uniforms.uAspect.value = size.width / size.height;
  };

  useEffect(() => {
    applyRect();
    if (reduced) {
      uniforms.uOpacity.value = 1;
      uniforms.uStrength.value = 0;
      invalidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, reduced]);

  const smoothPointer = useRef({ x: 0.5, y: 0.5 });

  useFrame((_, delta) => {
    if (reduced) return;
    uniforms.uTime.value += delta;
    applyRect();

    // O painel acompanha, não persegue: o atraso é o que faz o vidro parecer
    // ter massa.
    smoothPointer.current.x = THREE.MathUtils.damp(smoothPointer.current.x, pointer.current.x, 5, delta);
    smoothPointer.current.y = THREE.MathUtils.damp(smoothPointer.current.y, pointer.current.y, 5, delta);
    uniforms.uPointer.value.set(smoothPointer.current.x, smoothPointer.current.y);

    // Retorno ao equilíbrio: subir é rápido, descer é lento. A distorção
    // responde na hora e se desfaz devagar — o oposto seria nervoso.
    const target = drive.current;
    const rate = target > uniforms.uStrength.value ? 7 : 1.7;
    uniforms.uStrength.value = THREE.MathUtils.damp(uniforms.uStrength.value, target, rate, delta);

    uniforms.uOpacity.value = THREE.MathUtils.damp(uniforms.uOpacity.value, 1, 3, delta);
  });

  return <ScreenQuad material={material} />;
}
