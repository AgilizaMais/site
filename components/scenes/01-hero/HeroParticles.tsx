'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap, registerGsap } from '@/lib/motion/gsap';
import { onSkipIntro } from '@/lib/motion/introBus';
import { PARTICLES_BY_TIER, particleCountFor } from './brainPointCloud';
import { useBrainCloud } from './useBrainCloud';
import { particlesVert } from './shaders/particles.vert';
import { particlesFrag } from './shaders/particles.frag';
import type { DeviceTier } from '@/lib/hooks/useDeviceTier';

type Props = {
  tier: DeviceTier;
  reduced: boolean;
  /** Atraso, em segundos, antes da formação começar. */
  formationDelay?: number;
};

const KEY_DIR = new THREE.Vector3(-0.3, 0.66, 0.68).normalize();
const RIM_DIR = new THREE.Vector3(0.92, 0.2, 0.32).normalize();
const POINTER_TILT = THREE.MathUtils.degToRad(2.2);
/** Três quartos: a forma nunca se apresenta de frente, e nunca gira. */
const BASE_YAW = THREE.MathUtils.degToRad(-84);
const BASE_PITCH = THREE.MathUtils.degToRad(8);

/** Opacidade final baixa: o objeto é fundo, o texto é primeiro plano. */
const PEAK_OPACITY = 0.95;

export function HeroParticles({ tier, reduced, formationDelay = 0.85 }: Props) {
  const points = useRef<THREE.Points>(null);
  const invalidate = useThree((s) => s.invalidate);
  const viewport = useThree((s) => s.viewport);
  const size = useThree((s) => s.size);

  // Enquadramento e contagem dependem do viewport, então são calculados antes
  // de pedir a nuvem ao worker.
  const narrow = viewport.width < 3.4;
  // Em retrato o objeto precisa de mais folga lateral: a silhueta é o que
  // identifica a forma, e cortá-la nas bordas destrói a leitura.
  const scale = THREE.MathUtils.clamp(
    Math.min(viewport.width / (narrow ? 3.2 : 2.6), viewport.height / 2.4),
    0.4,
    1.24,
  );
  const objectWidthPx = (scale * 2.2 * size.width) / viewport.width;
  const cloud = useBrainCloud(particleCountFor(PARTICLES_BY_TIER[tier], objectWidthPx ** 2));
  const mountedAt = useRef(typeof performance === 'undefined' ? 0 : performance.now());

  const geometry = useMemo(() => {
    if (!cloud) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(cloud.positions, 3));
    geo.setAttribute('aNormal', new THREE.BufferAttribute(cloud.normals, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(cloud.seeds, 4));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 4);
    return geo;
  }, [cloud]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFormation: { value: reduced ? 1 : 0 },
      uBreath: { value: reduced ? 0 : 0.022 },
      uDrift: { value: reduced ? 0 : 0.016 },
      uSize: { value: tier === 'low' ? 3.6 : 3.3 },
      uPixelRatio: { value: 1 },
      uKeyDir: { value: KEY_DIR },
      uRimDir: { value: RIM_DIR },
      uColorLight: { value: new THREE.Color('#fff8f1') },
      uColorAccent: { value: new THREE.Color('#f97316') },
      uOpacity: { value: reduced ? PEAK_OPACITY : 0 },
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

  // Formação: dispersão → forma. Começa quando a nuvem fica pronta.
  useEffect(() => {
    registerGsap();
    if (!cloud) return;
    if (reduced) {
      invalidate();
      return;
    }

    // Se o worker demorou mais que o atraso previsto, a formação começa já.
    const elapsed = (performance.now() - mountedAt.current) / 1000;
    const tl = gsap.timeline({ delay: Math.max(0, formationDelay - elapsed) });
    tl.to(uniforms.uOpacity, { value: PEAK_OPACITY, duration: 1.4, ease: 'none' }, 0);
    tl.to(uniforms.uFormation, { value: 1, duration: 2.4, ease: 'none' }, 0);

    const off = onSkipIntro(() => tl.totalProgress(1));

    return () => {
      off();
      tl.kill();
    };
  }, [cloud, reduced, formationDelay, uniforms, invalidate]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const pointer = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    uniforms.uTime.value += delta;
    uniforms.uPixelRatio.value = state.gl.getPixelRatio();

    if (reduced || !points.current) return;

    // Parallax de cursor. Amplitude pequena: acompanha, não persegue.
    pointer.current.x = THREE.MathUtils.lerp(pointer.current.x, state.pointer.x, 0.045);
    pointer.current.y = THREE.MathUtils.lerp(pointer.current.y, state.pointer.y, 0.045);
    points.current.rotation.y = BASE_YAW + pointer.current.x * POINTER_TILT;
    points.current.rotation.x = BASE_PITCH - pointer.current.y * POINTER_TILT * 0.5;
  });

  if (!geometry) return null;

  // No desktop o objeto sai do centro: o texto ocupa a esquerda e cruza a borda
  // dele. No mobile fica centralizado e acima do texto.
  const objectX = narrow ? 0 : viewport.width * 0.06;
  const objectY = narrow ? viewport.height * 0.19 : 0.1;

  return (
    <points
      ref={points}
      geometry={geometry}
      material={material}
      scale={scale}
      position={[objectX, objectY, 0]}
      rotation={[BASE_PITCH, BASE_YAW, 0]}
    />
  );
}
