'use client';

import { useEffect, useState } from 'react';
import type { ImageCloud, SampleOptions } from './imageCloud';

import brainSource from './assets/brain-source.jpg';

/**
 * A URL vem do import estático: assim o bundler aplica sozinho o `basePath`
 * quando o site é servido em subpasta, sem precisar descobri-lo em runtime.
 */
export const HERO_SOURCE: string = brainSource.src;

/** Alvo de partículas por tier. É teto de custo, não densidade. */
const COUNT_BY_TIER: Record<string, number> = {
  high: 220_000,
  mid: 130_000,
  low: 55_000,
  none: 130_000,
};

/** Área do objeto, em px CSS², na composição de referência. */
const REFERENCE_AREA = 820 * 820;

/**
 * A contagem acompanha a área que o objeto ocupa na tela: contagem fixa
 * satura o blending aditivo em telas pequenas e vira borrão.
 * O valor é quantizado para não reamostrar a cada pixel de resize.
 */
export function countFor(tier: string, objectAreaPx: number): number {
  const max = COUNT_BY_TIER[tier] ?? COUNT_BY_TIER.mid!;
  const ratio = Math.min(1, objectAreaPx / REFERENCE_AREA) ** 0.8;
  return Math.min(max, Math.max(30_000, Math.round((max * ratio) / 10_000) * 10_000));
}

/**
 * Amostra a imagem-fonte num worker. Sem suporte a Worker ou a OffscreenCanvas,
 * cai para o canvas da main thread.
 */
export function useBrainCloud(options: SampleOptions): ImageCloud | null {
  const [cloud, setCloud] = useState<ImageCloud | null>(null);
  const key = `${options.count}|${options.worldWidth}|${options.depth}`;

  useEffect(() => {
    let cancelled = false;
    const [count, worldWidth, depth] = key.split('|').map(Number) as [number, number, number];
    const opts: SampleOptions = { count, worldWidth, depth };
    const url = HERO_SOURCE;

    const useWorker =
      typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined';

    if (useWorker) {
      const worker = new Worker(new URL('./cloud.worker.ts', import.meta.url));
      worker.onmessage = (event: MessageEvent<ImageCloud>) => {
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
  }, [key]);

  return cloud;
}

async function sampleOnMainThread(url: string, options: SampleOptions): Promise<ImageCloud> {
  const { sampleImage } = await import('./imageCloud');
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
  return sampleImage(data.data, canvas.width, canvas.height, options);
}
