'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useDeviceTier } from '@/lib/hooks/useDeviceTier';
import { useInViewport } from '@/lib/hooks/useInViewport';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';
import type { PanelRect } from './GlassPanel';

const SelfEsteemScene = dynamic(
  () => import('./SelfEsteemScene').then((m) => m.SelfEsteemScene),
  { ssr: false },
);

export function SelfEsteemCanvas({
  rect,
  drive,
  pointer,
}: {
  rect: { current: PanelRect };
  drive: { current: number };
  pointer: { current: { x: number; y: number } };
}) {
  const tier = useDeviceTier();
  const { reduced } = useMotionPreference();
  const [mounted, setMounted] = useState(false);
  const { ref, inView } = useInViewport<HTMLDivElement>();

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const noWebgl = tier === 'none' && !reduced;

  return (
    <div ref={ref} className="absolute inset-0" aria-hidden>
      {mounted && !noWebgl && (
        <SelfEsteemScene
          tier={tier === 'none' ? 'mid' : tier}
          reduced={reduced}
          active={inView}
          rect={rect}
          drive={drive}
          pointer={pointer}
        />
      )}
    </div>
  );
}
