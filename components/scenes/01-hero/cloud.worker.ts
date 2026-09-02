/// <reference lib="webworker" />
import { createBrainFilaments, type Quality } from './brainFilaments';

/**
 * O traçado dos filamentos custa de 0,9s a 3,4s conforme a qualidade. Rodá-lo
 * aqui mantém a main thread livre durante a entrada — a animação do loader não
 * perde um frame. Os buffers voltam como transferíveis: nenhuma cópia.
 */
self.onmessage = (event: MessageEvent<{ quality: Quality; seed?: number }>) => {
  const { quality, seed } = event.data;
  const cloud = createBrainFilaments(quality, seed);
  self.postMessage(cloud, [
    cloud.positions.buffer,
    cloud.normals.buffer,
    cloud.seeds.buffer,
  ]);
};
