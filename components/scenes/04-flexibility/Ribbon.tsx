'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GL_PALETTE } from '@/lib/theme/ThemeProvider';
import { ribbonVert } from './shaders/ribbon.vert';
import { ribbonFrag } from './shaders/ribbon.frag';
import type { DeviceTier } from '@/lib/hooks/useDeviceTier';

type Props = {
  tier: DeviceTier;
  reduced: boolean;
  /** Fonte de verdade do scrub, escrita pelo ScrollTrigger. */
  progress: { value: number };
};

/**
 * Densidade da malha. O comprimento precisa de muitos segmentos — é ali que a
 * torção acontece e onde facetas apareceriam. A largura precisa de poucos: a
 * seção transversal é reta.
 */
const SEGMENTS: Record<DeviceTier, [number, number]> = {
  high: [300, 20],
  mid: [220, 14],
  low: [140, 10],
  none: [140, 10],
};

/** Direção da key light, em espaço de mundo. Rasante, vinda de cima à esquerda. */
const KEY_DIR = new THREE.Vector3(-0.42, 0.78, 0.46).normalize();

/**
 * Em retrato a fita ondula menos — precisa, senão sai pelo topo — e com pouca
 * inclinação quase nenhuma face encontra uma luz rasante: o trecho visível
 * caía inteiro no escuro. Ali a key vem mais de frente.
 */
const KEY_DIR_NARROW = new THREE.Vector3(-0.34, 0.42, 0.84).normalize();

/** Fill fraca do lado oposto: nenhuma orientação da fita cai no preto puro. */
const FILL_DIR = new THREE.Vector3(0.62, -0.44, 0.65).normalize();

export function Ribbon({ tier, reduced, progress }: Props) {
  const mesh = useRef<THREE.Mesh>(null);
  const viewport = useThree((s) => s.viewport);
  const invalidate = useThree((s) => s.invalidate);

  const smoothed = useRef(reduced ? 1 : 0);
  const pointer = useRef(0);

  /**
   * Enquadramento.
   *
   * A fita atravessa a tela inteira e sai pelas duas bordas: nenhuma ponta
   * visível, porque uma ponta transformaria a fita num objeto e ela é um
   * percurso.
   *
   * Em retrato a janela é estreita: com o comprimento do desktop, sobraria
   * um pedacinho reto no meio de uma fita muito longa. Ali a fita encurta, a
   * ondulação diminui na mesma proporção — senão ela sairia pelo topo — e a
   * faixa sobe, porque embaixo fica o texto.
   */
  const narrow = viewport.width < 1.6;
  const length = narrow ? Math.max(viewport.width * 2.8, 2.3) : Math.max(viewport.width * 1.5, 4.2);
  const amp = narrow ? 0.6 : 1;
  const width = narrow ? 0.46 : 0.5;
  const offsetY = narrow ? 0.3 : 0;
  // Em retrato a fita corre na diagonal: horizontal, numa janela alta e
  // estreita, ela viraria um traço perdido no meio de muito preto.
  const roll = narrow ? -0.24 : 0;

  const geometry = useMemo(() => {
    const [sx, sy] = SEGMENTS[tier];
    return new THREE.PlaneGeometry(1, 1, sx, sy);
  }, [tier]);

  const uniforms = useMemo(
    () => ({
      /**
       * No modo reduzido a cena é um quadro só. O tempo não fica em zero: ali
       * a fita passa por si mesma quase no mesmo plano e a interseção abre
       * cunhas escuras. Este instante é um em que ela está aberta.
       */
      uTime: { value: reduced ? 3.2 : 0 },
      uProgress: { value: reduced ? 1 : 0 },
      uPointer: { value: 0 },
      uWidth: { value: width },
      uLength: { value: length },
      uAmp: { value: amp },
      uShadow: { value: new THREE.Color(GL_PALETTE.surfaceShadow) },
      uLight: { value: new THREE.Color(GL_PALETTE.surfaceLight) },
      uAccent: { value: new THREE.Color(GL_PALETTE.accent) },
      uKeyDir: { value: (narrow ? KEY_DIR_NARROW : KEY_DIR).clone() },
      uFillDir: { value: FILL_DIR.clone() },
      uOpacity: { value: reduced ? 1 : 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reduced],
  );

  useEffect(() => {
    uniforms.uLength.value = length;
    uniforms.uAmp.value = amp;
    uniforms.uWidth.value = width;
    uniforms.uKeyDir.value.copy(narrow ? KEY_DIR_NARROW : KEY_DIR);
  }, [length, amp, width, narrow, uniforms]);

  /** Material imperativo: o R3F clonaria o objeto passado como prop. */
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ribbonVert,
        fragmentShader: ribbonFrag,
        // A fita é superfície iluminada, não luz somada: normal nos dois temas.
        transparent: true,
        side: THREE.DoubleSide,
        uniforms,
      }),
    [uniforms],
  );

  useEffect(() => {
    if (!reduced) return;
    uniforms.uOpacity.value = 1;
    uniforms.uProgress.value = 1;
    invalidate();
  }, [reduced, uniforms, invalidate]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((state, delta) => {
    if (reduced) return;
    uniforms.uTime.value += delta;

    // O scrub já suaviza, mas a roda do mouse entrega saltos — e um salto
    // aqui leria como ruptura, o oposto do que a cena diz.
    smoothed.current = THREE.MathUtils.damp(smoothed.current, progress.value, 5, delta);
    uniforms.uProgress.value = smoothed.current;

    pointer.current = THREE.MathUtils.damp(pointer.current, state.pointer.x, 3, delta);
    uniforms.uPointer.value = pointer.current;

    uniforms.uOpacity.value = THREE.MathUtils.damp(uniforms.uOpacity.value, 1, 2.5, delta);
  });

  return <mesh ref={mesh} geometry={geometry} material={material} position={[0, offsetY, 0]} rotation={[0, 0, roll]} />;
}
