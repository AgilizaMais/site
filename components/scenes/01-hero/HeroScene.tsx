'use client';

import { SceneCanvas } from '@/components/canvas/SceneCanvas';
import { HeroParticles } from './HeroParticles';
import type { DeviceTier } from '@/lib/hooks/useDeviceTier';
import type { HeroFrame } from './useHeroFrame';

/** Ponto de entrada do chunk WebGL do Hero — carregado sob demanda. */
export function HeroScene({
  tier,
  reduced,
  active,
  frame,
}: {
  tier: DeviceTier;
  reduced: boolean;
  /** Falso quando a cena saiu do viewport — o loop pausa. */
  active: boolean;
  frame: HeroFrame;
}) {
  return (
    <SceneCanvas
      tier={tier}
      active={active && !reduced}
      still={reduced}
      camera={{ position: [0, 0.15, 4.2], fov: 38, near: 0.1, far: 20 }}
    >
      <HeroParticles tier={tier} reduced={reduced} frame={frame} />
    </SceneCanvas>
  );
}
