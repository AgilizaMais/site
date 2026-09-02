'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useDeviceTier } from '@/lib/hooks/useDeviceTier';
import { useInViewport } from '@/lib/hooks/useInViewport';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';

const AnxietyScene = dynamic(() => import('./AnxietyScene').then((m) => m.AnxietyScene), {
  ssr: false,
});

export function AnxietyCanvas({ progress }: { progress: { value: number } }) {
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
        <AnxietyScene
          tier={tier === 'none' ? 'mid' : tier}
          reduced={reduced}
          active={inView}
          progress={progress}
        />
      )}
    </div>
  );
}
