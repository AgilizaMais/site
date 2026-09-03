'use client';

import { SceneCanvas } from '@/components/canvas/SceneCanvas';
import { Sparks } from './Sparks';
import type { DeviceTier } from '@/lib/hooks/useDeviceTier';

/**
 * Camada de faíscas do contorno da fotografia — carregada sob demanda.
 *
 * Câmera ortográfica: esta camada não tem profundidade nem perspectiva, ela
 * só precisa cair exatamente sobre a foto. O `Sparks` ajusta o zoom para que
 * uma unidade de mundo valha a altura da caixa.
 */
export function SparksScene({
  tier,
  reduced,
  active,
  delay,
}: {
  tier: DeviceTier;
  reduced: boolean;
  active: boolean;
  delay: number;
}) {
  return (
    <SceneCanvas
      tier={tier}
      active={active && !reduced}
      still={reduced}
      orthographic
      camera={{ position: [0, 0, 1], near: 0.01, far: 10 }}
    >
      <Sparks tier={tier} reduced={reduced} delay={delay} />
    </SceneCanvas>
  );
}
