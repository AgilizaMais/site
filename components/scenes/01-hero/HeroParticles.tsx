'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap, registerGsap } from '@/lib/motion/gsap';
import { onSkipIntro } from '@/lib/motion/introBus';
import { GL_PALETTE } from '@/lib/theme/ThemeProvider';
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
  const points = useRef<THREE.Points>(null);
  const invalidate = useThree((s) => s.invalidate);
  const viewport = useThree((s) => s.viewport);
  const size = useThree((s) => s.size);
  const mountedAt = useRef(typeof performance === 'undefined' ? 0 : performance.now());

  /**
   * Retrato ou paisagem — decidido pela largura do canvas em pixels CSS, no
   * mesmo ponto de quebra do layout (`md`, 768px).
   *
   * A versão anterior comparava `viewport.width`, que é largura em unidades de
   * mundo e portanto derivada do ASPECTO. Uma medição transitória do canvas
   * durante o carregamento virava um aspecto errado, o objeto ia para o ramo
   * de paisagem — maior e deslocado para a direita — e só voltava quando o
   * aspecto mudava de novo. Pixels CSS não têm essa ambiguidade.
   */
  const narrow = size.width < 768;

  /**
   * Enquadramento, sempre como fração da largura do canvas: o que quer que
   * aconteça com o tamanho do canvas, o objeto ocupa a mesma parte dele.
   *
   * O segundo termo, em paisagem, usa `viewport.height` — que é constante,
   * porque depende só da câmera. Ele existe para o objeto não estourar numa
   * janela muito larga; sem clamp mínimo, que era o que fazia o tamanho pular
   * entre dois valores quando o cálculo passava rente ao limite.
   */
  const worldWidth = narrow
    ? viewport.width / 1.3
    : Math.min(viewport.width / 1.55, (viewport.height / 1.5) * SOURCE_ASPECT);

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
      uColorLight: { value: new THREE.Color(GL_PALETTE.light) },
      uColorAccent: { value: new THREE.Color(GL_PALETTE.accent) },
      uGain: { value: GL_PALETTE.gain },
      uOpacity: { value: reduced ? PEAK_OPACITY : 0 },
      /** Aproximação de entrada. Era um `scale` em CSS — ver Hero.tsx. */
      uZoom: { value: reduced ? 1 : 1.07 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // O desenho é luz somada sobre o preto.
        blending: THREE.AdditiveBlending,
        uniforms,
      }),
    [uniforms],
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
    tl.to(uniforms.uZoom, { value: 1, duration: 1.6, ease: 'power2.out' }, 0);

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
