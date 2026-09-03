'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap, registerGsap } from '@/lib/motion/gsap';
import { onSkipIntro } from '@/lib/motion/introBus';
import { GL_PALETTE, useTheme } from '@/lib/theme/ThemeProvider';
import { countFor, useBrainCloud } from './useBrainCloud';
import { particlesVert } from './shaders/particles.vert';
import { particlesFrag } from './shaders/particles.frag';
import type { DeviceTier } from '@/lib/hooks/useDeviceTier';

type Props = {
  tier: DeviceTier;
  reduced: boolean;
  /** Atraso, em segundos, antes da formação começar. */
  formationDelay?: number;
};

const POINTER_TILT = THREE.MathUtils.degToRad(1.6);

/** Opacidade final: o objeto é fundo, o texto é primeiro plano. */
const PEAK_OPACITY = 0.92;

/** Proporção da imagem-fonte (900×817). */
const SOURCE_ASPECT = 900 / 817;

export function HeroParticles({ tier, reduced, formationDelay = 0.85 }: Props) {
  const { theme } = useTheme();
  const palette = GL_PALETTE[theme];
  const points = useRef<THREE.Points>(null);
  const invalidate = useThree((s) => s.invalidate);
  const viewport = useThree((s) => s.viewport);
  const size = useThree((s) => s.size);
  const mountedAt = useRef(typeof performance === 'undefined' ? 0 : performance.now());

  const narrow = viewport.width < 3.4;

  /**
   * Enquadramento.
   *
   * `viewport.height` é constante (depende só da câmera), então o termo de
   * largura equivale a uma fração fixa da largura do canvas em pixels — e o
   * termo de altura, a uma fração da ALTURA. No celular a altura muda sozinha
   * quando a barra do navegador recolhe: o objeto era enquadrado pela altura,
   * e mudava de tamanho e de lugar no primeiro gesto de scroll.
   *
   * Em retrato o enquadramento passa a depender só da largura, que é estável.
   * Em paisagem o termo de altura continua, porque ali é ele que impede o
   * objeto de estourar numa janela baixa — e ali a altura não oscila.
   */
  const worldWidth = THREE.MathUtils.clamp(
    narrow
      ? viewport.width / 1.3
      : Math.min(viewport.width / 1.55, (viewport.height / 1.5) * SOURCE_ASPECT),
    1.0,
    3.4,
  );

  const objectWidthPx = (worldWidth * size.width) / viewport.width;

  const cloud = useBrainCloud({
    count: countFor(tier, objectWidthPx ** 2),
    worldWidth,
    depth: worldWidth * 0.085,
  });

  const geometry = useMemo(() => {
    if (!cloud) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(cloud.positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(cloud.seeds, 4));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 4);
    return geo;
  }, [cloud]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFormation: { value: reduced ? 1 : 0 },
      uBreath: { value: reduced ? 0 : 0.03 },
      uDrift: { value: reduced ? 0 : 0.016 },
      uSize: { value: tier === 'low' ? 2.4 : 2.0 },
      uPixelRatio: { value: 1 },
      uColorLight: { value: new THREE.Color(palette.light) },
      uColorAccent: { value: new THREE.Color(palette.accent) },
      uGain: { value: palette.gain },
      uOpacity: { value: reduced ? PEAK_OPACITY : 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reduced, tier, theme],
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
        /**
         * No escuro o desenho é luz somada sobre o preto. No claro é tinta
         * depositada sobre o papel — aditivo sobre branco não escurece nada e
         * a cena simplesmente desapareceria.
         */
        blending: palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        uniforms,
      }),
    [uniforms, palette.additive],
  );

  // Formação: dispersão → desenho. Começa quando a nuvem fica pronta.
  useEffect(() => {
    registerGsap();
    if (!cloud) return;
    if (reduced) {
      invalidate();
      return;
    }

    // Se a amostragem demorou mais que o atraso previsto, a formação começa já.
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

    // Paralaxe discreta. A nuvem tem pouca profundidade, então rotações
    // grandes revelariam que ela é quase plana.
    pointer.current.x = THREE.MathUtils.lerp(pointer.current.x, state.pointer.x, 0.045);
    pointer.current.y = THREE.MathUtils.lerp(pointer.current.y, state.pointer.y, 0.045);
    points.current.rotation.y = pointer.current.x * POINTER_TILT;
    points.current.rotation.x = -pointer.current.y * POINTER_TILT * 0.6;
  });

  if (!geometry) return null;

  // No desktop o objeto sai do centro: o texto ocupa a esquerda e cruza a
  // borda dele. No mobile fica centralizado e acima do texto.
  const objectX = narrow ? 0 : viewport.width * 0.11;
  // Também em unidades do objeto, e não da altura do viewport: a barra do
  // navegador não pode reposicionar o cérebro.
  const objectY = narrow ? worldWidth * 0.34 : 0.04;

  return <points ref={points} geometry={geometry} material={material} position={[objectX, objectY, 0]} />;
}
