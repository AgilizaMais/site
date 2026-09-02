/// <reference lib="webworker" />
import { createBrainCloud } from './brainPointCloud';

/**
 * A amostragem do SDF custa centenas de milissegundos. Rodá-la aqui mantém a
 * main thread livre durante a entrada — a animação do loader não perde um frame.
 * Os buffers voltam como transferíveis: nenhuma cópia.
 */
self.onmessage = (event: MessageEvent<{ count: number; seed?: number }>) => {
  const { count, seed } = event.data;
  const cloud = createBrainCloud(count, seed);

  const positions = cloud.positions.slice(0, cloud.count * 3);
  const normals = cloud.normals.slice(0, cloud.count * 3);
  const seeds = cloud.seeds.slice(0, cloud.count * 4);

  self.postMessage({ positions, normals, seeds, count: cloud.count }, [
    positions.buffer,
    normals.buffer,
    seeds.buffer,
  ]);
};
