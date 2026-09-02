'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap, registerGsap } from '@/lib/motion/gsap';
import { onSkipIntro } from '@/lib/motion/introBus';
import { createBustCloud, PARTICLES_BY_TIER } from './bustPointCloud';
import { particlesVert } from './shaders/particles.vert';
import { particlesFrag } from './shaders/particles.frag';
import type { DeviceTier } from '@/lib/hooks/useDeviceTier';

type Props = {
  tier: DeviceTier;
  reduced: boolean;
  /** Atraso, em segundos, antes da formação começar (sincronia com a timeline do Hero). */
  formationDelay?: number;
};

const KEY_DIR = new THREE.Vector3(-0.25, 0.72, 0.64).normalize();
const RIM_DIR = new THREE.Vector3(0.92, 0.18, 0.34).normalize();
const POINTER_TILT = THREE.MathUtils.degToRad(1.2);
/** Três quartos: quebra a leitura de ícone e dá volume à luz lateral. */
const BASE_YAW = THREE.MathUtils.degToRad(-19);

export function HeroParticles({ tier, reduced, formationDelay = 0.85 }: Props) {
  const points = useRef<THREE.Points>(null);
  const invalidate = useThree((s) => s.invalidate);
  const viewport = useThree((s) => s.viewport);

  const count = PARTICLES_BY_TIER[tier];

  const geometry = useMemo(() => {
    const cloud = createBustCloud(count);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.BufferAttribute(cloud.positions.subarray(0, cloud.count * 3), 3),
    );
    geo.setAttribute(
      'aNormal',
      new THREE.BufferAttribute(cloud.normals.subarray(0, cloud.count * 3), 3),
    );
    geo.setAttribute('aSeed', new THREE.BufferAttribute(cloud.seeds.subarray(0, cloud.count * 2), 2));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.4, 0), 3.2);
    return geo;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFormation: { value: reduced ? 1 : 0 },
      uBreath: { value: reduced ? 0 : 0.015 },
      uSize: { value: tier === 'low' ? 2.2 : 1.7 },
      uPixelRatio: { value: 1 },
      uKeyDir: { value: KEY_DIR },
      uRimDir: { value: RIM_DIR },
      uColorLight: { value: new THREE.Color('#fff8f1') },
      uColorAccent: { value: new THREE.Color('#f97316') },
      uOpacity: { value: reduced ? 0.55 : 0 },
    }),
    [reduced, tier],
  );

  /**
   * O material é construído aqui, e não pela prop `uniforms` de <shaderMaterial>:
   * o R3F clona esse objeto ao aplicá-lo como prop, o que deixaria as tweens do
   * GSAP animando uma cópia órfã. O construtor do three guarda a referência.
   */
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particlesVert,
        fragmentShader: particlesFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms,
      }),
    [uniforms],
  );

  // Formação: dispersão → busto. Uma única tween; nenhum trabalho por frame na CPU.
  useEffect(() => {
    registerGsap();
    if (reduced) {
      invalidate();
      return;
    }

    const tl = gsap.timeline({ delay: formationDelay });
    tl.to(uniforms.uOpacity, { value: 0.55, duration: 1.2, ease: 'none' }, 0);
    tl.to(uniforms.uFormation, { value: 1, duration: 2.2, ease: 'none' }, 0);

    // Qualquer interação do usuário durante a entrada avança a timeline até o fim.
    const off = onSkipIntro(() => tl.totalProgress(1));

    return () => {
      off();
      tl.kill();
    };
  }, [reduced, formationDelay, uniforms, invalidate]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const pointer = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    uniforms.uTime.value += delta;
    uniforms.uPixelRatio.value = state.gl.getPixelRatio();

    if (reduced || !points.current) return;

    // Parallax de cursor: ±1,2°, com lerp lento. Discreto por decisão de arte.
    pointer.current.x = THREE.MathUtils.lerp(pointer.current.x, state.pointer.x, 0.06);
    pointer.current.y = THREE.MathUtils.lerp(pointer.current.y, state.pointer.y, 0.06);
    points.current.rotation.y = BASE_YAW + pointer.current.x * POINTER_TILT;
    points.current.rotation.x = -pointer.current.y * POINTER_TILT * 0.6;
  });

  // Enquadramento: o busto ocupa a altura útil sem encostar nas bordas.
  const scale = Math.min(1.15, Math.max(0.68, viewport.height / 5.2));

  return (
    <points
      ref={points}
      geometry={geometry}
      material={material}
      scale={scale}
      position={[0, -0.35, 0]}
      rotation={[0, BASE_YAW, 0]}
    />
  );
}
