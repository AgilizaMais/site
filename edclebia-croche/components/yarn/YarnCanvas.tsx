'use client';

import { useEffect, useRef } from 'react';
import type { YarnEngine, PhotoOptions } from '@/lib/yarn/YarnEngine';
import { detectTier } from '@/lib/motion/tier';
import { scrollBus } from '@/lib/motion/bus';

type Props = {
  preset: 'hero' | 'heart';
  className?: string;
  /** foto do DOM que o WebGL replica (só no hero) */
  photo?: Omit<PhotoOptions, 'el'> & { ref: React.RefObject<HTMLImageElement | null> };
  /** recebe a instância quando o motor fica pronto */
  onEngine?: (engine: YarnEngine) => void;
  onPhotoReady?: () => void;
  /** chamado se o aparelho não tiver WebGL2 */
  onFallback?: () => void;
  autoStart?: boolean;
};

/**
 * Monta o motor de fios sob demanda: o Three.js só é baixado depois da primeira
 * pintura, num chunk separado — o HTML e a foto do hero chegam antes.
 */
export function YarnCanvas({ preset, className, photo, onEngine, onPhotoReady, onFallback, autoStart = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cbs = useRef({ onEngine, onPhotoReady, onFallback });
  cbs.current = { onEngine, onPhotoReady, onFallback };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tier = detectTier();
    if (!tier) {
      cbs.current.onFallback?.();
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let engine: YarnEngine | null = null;
    let off: (() => void) | null = null;
    let cancelled = false;

    Promise.all([import('@/lib/yarn/YarnEngine'), import('@/lib/yarn/presets')])
      .then(([{ YarnEngine }, presets]) => {
        if (cancelled) return;
        const photoEl = photo?.ref.current;
        engine = new YarnEngine(canvas, {
          scene: preset === 'hero' ? presets.heroScene : presets.heartScene,
          tier,
          reduced,
          photo: photo && photoEl ? { el: photoEl, src: photo.src, fringe: photo.fringe, fade: photo.fade } : undefined,
          onPhotoReady: () => cbs.current.onPhotoReady?.(),
        });
        off = scrollBus.on((s) => engine?.setScrollVelocity(s.velocity));
        if (autoStart) engine.start();
        cbs.current.onEngine?.(engine);
      })
      .catch((err) => {
        console.error(err);
        cbs.current.onFallback?.();
      });

    return () => {
      cancelled = true;
      off?.();
      engine?.dispose();
    };
    // a cena é montada uma única vez por instância
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
