/// <reference lib="webworker" />
import { sampleImage, type ImageCloud, type SampleOptions } from './imageCloud';

type Request = { url: string; options: SampleOptions };

/**
 * Decodifica a imagem-fonte e amostra as partículas fora da main thread.
 * Os buffers voltam como transferíveis: nenhuma cópia.
 */
self.onmessage = async (event: MessageEvent<Request>) => {
  const { url, options } = event.data;

  const response = await fetch(url);
  const bitmap = await createImageBitmap(await response.blob());

  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('sem contexto 2d no worker');
  ctx.drawImage(bitmap, 0, 0);
  // As dimensões saem do ImageData, e não do bitmap: `close()` zera a largura
  // e a altura do bitmap, e lê-las depois devolve 0 silenciosamente.
  const image = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  bitmap.close();

  const cloud: ImageCloud = sampleImage(image.data, image.width, image.height, options);

  // `subarray` compartilha o buffer original; a cópia garante um buffer do
  // tamanho exato para transferir.
  const positions = cloud.positions.slice();
  const seeds = cloud.seeds.slice();

  self.postMessage({ positions, seeds, count: cloud.count }, [positions.buffer, seeds.buffer]);
};
