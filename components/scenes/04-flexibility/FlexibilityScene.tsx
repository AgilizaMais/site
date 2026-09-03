'use client';

import { SceneCanvas } from '@/components/canvas/SceneCanvas';
import { Ribbon } from './Ribbon';
import type { DeviceTier } from '@/lib/hooks/useDeviceTier';

/** Ponto de entrada do chunk WebGL da Cena 4 — carregado sob demanda. */
export function FlexibilityScene({
  tier,
  reduced,
  active,
  progress,
}: {
  tier: DeviceTier;
  reduced: boolean;
  active: boolean;
  progress: { value: number };
}) {
  return (
    <SceneCanvas
      tier={tier}
      active={active && !reduced}
      still={reduced}
      camera={{ position: [0, 0, 2.6], fov: 45, near: 0.1, far: 20 }}
    >
      <Ribbon tier={tier} reduced={reduced} progress={progress} />
    </SceneCanvas>
  );
}
