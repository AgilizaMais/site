'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap, registerGsap } from '@/lib/motion/gsap';
import { onSkipIntro } from '@/lib/motion/introBus';
import { GL_PALETTE } from '@/lib/theme/ThemeProvider';
import { silhouetteCountFor, useSilhouetteCloud } from './useSilhouetteCloud';
import { sparksVert } from './shaders/sparks.vert';
import { sparksFrag } from './shaders/sparks.frag';
import type { DeviceTier } from '@/lib/hooks/useDeviceTier';

type Props = {
  tier: DeviceTier;
  reduced: boolean;
  /** Atraso, em segundos, para acompanhar a subida da fotografia. */
  delay: number;
};

export function Sparks({ tier, reduced, delay }: Props) {
  const points = useRef<THREE.Points>(null);
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);

  const cloud = useSilhouetteCloud({ count: silhouetteCountFor(tier) });

  /**
   * A câmera ortográfica do R3F monta o frustum em PIXELS e divide pelo zoom.
   * Com `zoom` igual à altura do canvas, uma unidade de mundo passa a valer
   * exatamente a altura da caixa — que é a normalização usada na amostragem.
   */
  useEffect(() => {
    const ortho = camera as THREE.OrthographicCamera;
    ortho.zoom = size.height;
    ortho.updateProjectionMatrix();
    invalidate();
  }, [camera, size, invalidate]);

  const geometry = useMemo(() => {
    if (!cloud) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(cloud.positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(cloud.seeds, 4));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 2);
    return geo;
  }, [cloud]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReveal: { value: reduced ? 1 : 0 },
      uDrift: { value: reduced ? 0 : 0.006 },
      uSize: { value: tier === 'low' ? 2.2 : 1.9 },
      uPixelRatio: { value: 1 },
      uColorLight: { value: new THREE.Color(GL_PALETTE.light) },
      uColorAccent: { value: new THREE.Color(GL_PALETTE.accent) },
      uOpacity: { value: 1 },
    }),
    [reduced, tier],
  );

  /** Material imperativo: o R3F clonaria o objeto passado como prop. */
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sparksVert,
        fragmentShader: sparksFrag,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        uniforms,
      }),
    [uniforms],
  );

  useEffect(() => {
    registerGsap();
    if (!cloud || reduced) {
      invalidate();
      return;
    }
    const tl = gsap.timeline({ delay });
    tl.to(uniforms.uReveal, { value: 1, duration: 1.9, ease: 'none' }, 0);

    const off = onSkipIntro(() => tl.totalProgress(1));
    return () => {
      off();
      tl.kill();
    };
  }, [cloud, reduced, delay, uniforms, invalidate]);

  useEffect(
    () => () => {
      geometry?.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((state, dt) => {
    uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    if (reduced) return;
    uniforms.uTime.value += dt;
  });

  if (!geometry) return null;
  return <points ref={points} geometry={geometry} material={material} />;
}
