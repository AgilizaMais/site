'use client';

import { Canvas, type CanvasProps } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { AdaptiveQuality } from './AdaptiveQuality';
import type { DeviceTier } from '@/lib/hooks/useDeviceTier';

const MAX_DPR: Record<DeviceTier, number> = { high: 2, mid: 1.5, low: 1, none: 1 };

type Props = {
  tier: DeviceTier;
  /** Falso pausa o loop: fora do viewport, aba oculta ou movimento reduzido. */
  active: boolean;
  /** Renderiza um único frame e para — usado no modo reduzido. */
  still?: boolean;
  children: React.ReactNode;
  className?: string;
} & Omit<CanvasProps, 'children' | 'className'>;

/**
 * Wrapper único para toda cena WebGL: DPR por tier, pausa por visibilidade,
 * frame único no modo reduzido e descarte de contexto no unmount.
 * docs/ARCHITECTURE.md §4
 */
export function SceneCanvas({ tier, active, still = false, children, className = '', ...rest }: Props) {
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const running = active && tabVisible && !still;

  return (
    <Canvas
      className={className}
      dpr={[1, MAX_DPR[tier]]}
      frameloop={running ? 'always' : still ? 'demand' : 'never'}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      // O canvas é decorativo; a descrição textual vive na <section>.
      aria-hidden
      {...rest}
    >
      {running && <AdaptiveQuality minDpr={1} />}
      {children}
    </Canvas>
  );
}
