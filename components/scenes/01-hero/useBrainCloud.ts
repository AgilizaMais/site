'use client';

import { useEffect, useState } from 'react';
import { createBrainCloud, type PointCloud } from './brainPointCloud';

/**
 * Gera a nuvem num worker. Se o ambiente não suportar Worker, cai para a
 * geração síncrona — mais lenta, porém correta.
 */
export function useBrainCloud(count: number): PointCloud | null {
  const [cloud, setCloud] = useState<PointCloud | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (typeof Worker === 'undefined') {
      setCloud(createBrainCloud(count));
      return;
    }

    const worker = new Worker(new URL('./cloud.worker.ts', import.meta.url));
    worker.onmessage = (event: MessageEvent<PointCloud>) => {
      if (!cancelled) setCloud(event.data);
      worker.terminate();
    };
    worker.onerror = () => {
      if (!cancelled) setCloud(createBrainCloud(count));
      worker.terminate();
    };
    worker.postMessage({ count });

    return () => {
      cancelled = true;
      worker.terminate();
    };
  }, [count]);

  return cloud;
}
