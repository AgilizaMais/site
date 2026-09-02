'use client';

import { SceneCanvas } from '@/components/canvas/SceneCanvas';
import { AnxietyLines } from './AnxietyLines';
import type { DeviceTier } from '@/lib/hooks/useDeviceTier';

/** Ponto de entrada do chunk WebGL da Cena 2 — carregado sob demanda. */
export function AnxietyScene({
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
      camera={{ position: [0, 0, 2], fov: 50, near: 0.1, far: 10 }}
    >
      <AnxietyLines reduced={reduced} progress={progress} />
    </SceneCanvas>
  );
}
