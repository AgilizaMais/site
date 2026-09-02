'use client';

import { SceneCanvas } from '@/components/canvas/SceneCanvas';
import { GlassPanel, type PanelRect } from './GlassPanel';
import type { DeviceTier } from '@/lib/hooks/useDeviceTier';

/** Ponto de entrada do chunk WebGL da Cena 3 — carregado sob demanda. */
export function SelfEsteemScene({
  tier,
  reduced,
  active,
  rect,
  drive,
  pointer,
}: {
  tier: DeviceTier;
  reduced: boolean;
  active: boolean;
  rect: { current: PanelRect };
  drive: { current: number };
  pointer: { current: { x: number; y: number } };
}) {
  return (
    <SceneCanvas
      tier={tier}
      active={active && !reduced}
      still={reduced}
      camera={{ position: [0, 0, 2], fov: 50, near: 0.1, far: 10 }}
    >
      <GlassPanel reduced={reduced} rect={rect} drive={drive} pointer={pointer} />
    </SceneCanvas>
  );
}
