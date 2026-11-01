import type { Tier } from '@/lib/yarn/YarnEngine';

type NavigatorExt = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

/** Qualidade do WebGL por aparelho. `null` = sem WebGL2 (usa fallback estático). */
export function detectTier(): Tier | null {
  if (typeof window === 'undefined') return 'mid';
  try {
    const c = document.createElement('canvas');
    if (!c.getContext('webgl2')) return null;
  } catch {
    return null;
  }
  const nav = navigator as NavigatorExt;
  if (nav.connection?.saveData) return 'low';
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (coarse) return cores >= 6 && mem >= 4 ? 'mid' : 'low';
  if (cores >= 8 && mem >= 8) return 'high';
  return cores <= 2 ? 'low' : 'mid';
}
