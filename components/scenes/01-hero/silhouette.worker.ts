/// <reference lib="webworker" />
import { sampleSilhouette, type SilhouetteCloud, type SilhouetteOptions } from './silhouette';

type Request = { url: string; options: SilhouetteOptions };

/** Lê o contorno da foto fora da main thread. Buffers voltam transferíveis. */
self.onmessage = async (event: MessageEvent<Request>) => {
  const { url, options } = event.data;

  const response = await fetch(url);
  const bitmap = await createImageBitmap(await response.blob());

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('sem contexto 2d no worker');
  ctx.drawImage(bitmap, 0, 0);
  // As dimensões saem do ImageData: `close()` zera as do bitmap.
  const image = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  bitmap.close();

  const cloud: SilhouetteCloud = sampleSilhouette(image.data, image.width, image.height, options);

  const positions = cloud.positions.slice();
  const seeds = cloud.seeds.slice();
  self.postMessage({ positions, seeds, count: cloud.count }, [positions.buffer, seeds.buffer]);
};
