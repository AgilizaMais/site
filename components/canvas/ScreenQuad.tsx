'use client';

import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Plano que cobre exatamente o viewport da cena. Cenas cujo desenho vive no
 * espaço de tela — linhas, refração, névoa — rodam num único draw call aqui,
 * sem geometria alguma.
 */
export function ScreenQuad({ material }: { material: THREE.ShaderMaterial }) {
  const viewport = useThree((s) => s.viewport);
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  return (
    <mesh geometry={geometry} material={material} scale={[viewport.width, viewport.height, 1]} />
  );
}
