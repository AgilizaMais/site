'use client';

import { useEffect, useState } from 'react';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';

export type DeviceTier = 'high' | 'mid' | 'low' | 'none';

type NavigatorExt = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

function detect(): DeviceTier {
  if (typeof window === 'undefined') return 'mid';

  const nav = navigator as NavigatorExt;
  if (nav.connection?.saveData) return 'low';

  try {
    const canvas = document.createElement('canvas');
    if (!canvas.getContext('webgl2')) return 'none';
  } catch {
    return 'none';
  }

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  if (coarse || memory <= 4) return memory <= 4 && cores <= 4 ? 'low' : 'mid';
  if (cores >= 8 && memory >= 8) return 'high';
  return 'mid';
}

/**
 * Tier de qualidade. Começa em 'mid' no servidor para evitar mismatch de
 * hidratação; o valor real chega no primeiro efeito.
 * docs/ARCHITECTURE.md §4
 */
export function useDeviceTier(): DeviceTier {
  const { reduced } = useMotionPreference();
  const [tier, setTier] = useState<DeviceTier>('mid');

  useEffect(() => {
    setTier(detect());
  }, []);

  return reduced ? 'none' : tier;
}
