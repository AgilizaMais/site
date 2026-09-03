'use client';

import { useEffect, useState } from 'react';
import type { SilhouetteCloud, SilhouetteOptions } from './silhouette';

import photo from './assets/rafaelle.webp';

/**
 * A URL vem do import estático: assim o bundler aplica sozinho o `basePath`
 * quando o site é servido em subpasta, sem precisar descobri-lo em runtime.
 */
export const HERO_PHOTO: string = photo.src;
export const HERO_PHOTO_WIDTH: number = photo.width;
export const HERO_PHOTO_HEIGHT: number = photo.height;

/** Contorno é linha, não volume: some centenas bastam. */
const COUNT_BY_TIER: Record<string, number> = {
  high: 4200,
  mid: 2800,
  low: 1400,
  none: 2800,
};

export function silhouetteCountFor(tier: string): number {
  return COUNT_BY_TIER[tier] ?? COUNT_BY_TIER.mid!;
}

/**
 * Amostra o contorno da foto num worker. Sem Worker ou OffscreenCanvas, cai
 * para o canvas da main thread — são poucos pontos, o custo é irrelevante.
 */
export function useSilhouetteCloud(options: SilhouetteOptions): SilhouetteCloud | null {
  const [cloud, setCloud] = useState<SilhouetteCloud | null>(null);
  const { count, coverage } = options;

  useEffect(() => {
    let cancelled = false;
    const opts: SilhouetteOptions = { count, coverage };
    const url = HERO_PHOTO;

    const useWorker = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';

    if (useWorker) {
      const worker = new Worker(new URL('./silhouette.worker.ts', import.meta.url));
      worker.onmessage = (event: MessageEvent<SilhouetteCloud>) => {
        if (!cancelled) setCloud(event.data);
        worker.terminate();
      };
      worker.onerror = () => {
        worker.terminate();
        void sampleOnMainThread(url, opts).then((c) => !cancelled && setCloud(c));
      };
      worker.postMessage({ url, options: opts });
      return () => {
        cancelled = true;
        worker.terminate();
      };
    }

    void sampleOnMainThread(url, opts).then((c) => !cancelled && setCloud(c));
    return () => {
      cancelled = true;
    };
  }, [count, coverage]);

  return cloud;
}

async function sampleOnMainThread(url: string, options: SilhouetteOptions): Promise<SilhouetteCloud> {
  const { sampleSilhouette } = await import('./silhouette');
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = url;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return sampleSilhouette(data.data, canvas.width, canvas.height, options);
}
