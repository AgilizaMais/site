'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrainFilaments, type BrainCloud, type Quality } from './brainFilaments';

/**
 * Gera a nuvem de filamentos num worker. Sem suporte a Worker, cai para a
 * geração síncrona — mais lenta, porém correta.
 */
export function useBrainCloud(quality: Quality): BrainCloud | null {
  const [cloud, setCloud] = useState<BrainCloud | null>(null);

  // A identidade do objeto muda a cada render; só os valores importam.
  const key = `${quality.cerebrumSeeds}|${quality.step}|${quality.maxSteps}`;

  useEffect(() => {
    let cancelled = false;
    const [cerebrumSeeds, step, maxSteps] = key.split('|').map(Number) as [
      number,
      number,
      number,
    ];
    const q: Quality = { cerebrumSeeds, step, maxSteps };

    if (typeof Worker === 'undefined') {
      setCloud(createBrainFilaments(q));
      return;
    }

    const worker = new Worker(new URL('./cloud.worker.ts', import.meta.url));
    worker.onmessage = (event: MessageEvent<BrainCloud>) => {
      if (!cancelled) setCloud(event.data);
      worker.terminate();
    };
    worker.onerror = () => {
      if (!cancelled) setCloud(createBrainFilaments(q));
      worker.terminate();
    };
    worker.postMessage({ quality: q });

    return () => {
      cancelled = true;
      worker.terminate();
    };
  }, [key]);

  return useMemo(() => cloud, [cloud]);
}
