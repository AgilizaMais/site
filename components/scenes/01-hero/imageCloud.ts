/**
 * Nuvem de partículas amostrada de uma imagem-fonte.
 *
 * A imagem não é desenhada: ela é lida para decidir ONDE cada partícula fica.
 * O que vai para a tela continua sendo geometria de pontos — que respira,
 * deriva, cintila e se forma a partir da dispersão. É a diferença entre exibir
 * uma imagem e usá-la como mapa de densidade.
 *
 * A amostragem é por rejeição, ponderada pelo brilho: onde a imagem é clara,
 * caem mais partículas; no fundo, nenhuma.
 */

export type ImageCloud = {
  positions: Float32Array;
  /** x: aleatório · y: variação de tamanho · z: brilho · w: calor (0 âmbar → 1 branco) */
  seeds: Float32Array;
  count: number;
};

export type SampleOptions = {
  /** Alvo de partículas. A contagem final pode ficar abaixo se a imagem for esparsa. */
  count: number;
  /** Largura do objeto em unidades de mundo; a altura segue o aspecto da imagem. */
  worldWidth: number;
  /** Profundidade máxima do relevo. */
  depth: number;
  seed?: number;
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ruído de valor 2D, para dar profundidade sem depender da imagem. */
function hash2(ix: number, iy: number) {
  let h = ix * 374761393 + iy * 668265263;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function noise2(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
}

export function sampleImage(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  o: SampleOptions,
): ImageCloud {
  const rand = mulberry32(o.seed ?? 20260902);
  const positions = new Float32Array(o.count * 3);
  const seeds = new Float32Array(o.count * 4);

  const worldHeight = (o.worldWidth * height) / width;
  const halfW = o.worldWidth / 2;
  const halfH = worldHeight / 2;

  let i = 0;
  let guard = 0;
  const maxTries = o.count * 260;

  while (i < o.count && guard++ < maxTries) {
    const px = Math.floor(rand() * width);
    const py = Math.floor(rand() * height);
    const idx = (py * width + px) * 4;

    const r = data[idx] ?? 0;
    const g = data[idx + 1] ?? 0;
    const b = data[idx + 2] ?? 0;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (lum < 0.06) continue;

    // Rejeição ponderada: o brilho da imagem é a densidade de partículas.
    // A raiz suaviza o contraste — sem ela, só as linhas mais claras existem.
    if (rand() > Math.sqrt(lum)) continue;

    // Posição, com um deslocamento sub-pixel para não formar grade.
    const x = ((px + rand()) / width) * o.worldWidth - halfW;
    const y = halfH - ((py + rand()) / height) * worldHeight;

    /**
     * Profundidade: a imagem é plana, então o relevo vem de um campo de ruído
     * suave somado a uma cúpula. Isso dá paralaxe e volume à respiração sem
     * inventar anatomia que a imagem não tem.
     */
    const dome = Math.max(0, 1 - (x * x) / (halfW * halfW) - (y * y) / (halfH * halfH));
    const z =
      (noise2(x * 2.6 + 11, y * 2.6 + 7) - 0.5) * o.depth +
      Math.sqrt(dome) * o.depth * 0.85 * (rand() < 0.5 ? 1 : -1);

    const i3 = i * 3;
    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    // Calor: quanto o pixel puxa para o branco em vez do âmbar.
    const warmth = Math.min(1, Math.max(0, (b / Math.max(r, 1)) * 1.35));

    const i4 = i * 4;
    seeds[i4] = rand();
    seeds[i4 + 1] = 0.45 + rand() * 0.55;
    seeds[i4 + 2] = Math.min(1, lum * 1.15);
    seeds[i4 + 3] = warmth;
    i += 1;
  }

  return {
    positions: positions.subarray(0, i * 3),
    seeds: seeds.subarray(0, i * 4),
    count: i,
  };
}
