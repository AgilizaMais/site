/**
 * Partículas ao longo do contorno de uma imagem com transparência.
 *
 * A foto da psicóloga é um PNG recortado: o canal alfa já é a silhueta dela.
 * Em vez de inventar onde o ombro e a borda do cabelo passam, o contorno é
 * lido do próprio arquivo — a densidade das partículas é a magnitude do
 * gradiente do alfa, que é máxima exatamente na aresta do recorte.
 *
 * É a mesma ideia da nuvem do cérebro (`imageCloud.ts`), com uma diferença:
 * lá a imagem é mapa de brilho, aqui é mapa de borda.
 */

export type SilhouetteCloud = {
  /** x, y em coordenadas normalizadas da caixa da foto; z é a profundidade. */
  positions: Float32Array;
  /** x: aleatório · y: variação de tamanho · z: brilho · w: calor */
  seeds: Float32Array;
  count: number;
};

export type SilhouetteOptions = {
  count: number;
  /**
   * Quanto do contorno recebe partículas, de cima para baixo. A cabeça e os
   * ombros integram a figura ao cenário; as pernas, no rodapé do quadro, só
   * sujariam a base.
   */
  coverage?: number;
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

export function sampleSilhouette(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  o: SilhouetteOptions,
): SilhouetteCloud {
  const rand = mulberry32(o.seed ?? 20260903);
  const coverage = o.coverage ?? 0.72;

  const positions = new Float32Array(o.count * 3);
  const seeds = new Float32Array(o.count * 4);

  const alphaAt = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0;
    return (data[(y * width + x) * 4 + 3] ?? 0) / 255;
  };

  const aspect = width / height;
  let i = 0;
  let guard = 0;
  const maxTries = o.count * 400;
  // Passo da diferença finita: um pixel dá gradiente só na aresta dura do
  // recorte. Alguns pixels pegam também a franja de cabelo, que é onde o
  // efeito precisa acontecer.
  const step = Math.max(2, Math.round(width / 260));

  while (i < o.count && guard++ < maxTries) {
    const px = Math.floor(rand() * width);
    const py = Math.floor(rand() * height * coverage);

    const gx = alphaAt(px + step, py) - alphaAt(px - step, py);
    const gy = alphaAt(px, py + step) - alphaAt(px, py - step);
    const edge = Math.min(1, Math.hypot(gx, gy));
    if (edge < 0.06) continue;
    if (rand() > edge) continue;

    /**
     * Coordenadas normalizadas pela ALTURA nos dois eixos: é o que a câmera
     * ortográfica da camada espera, e o que mantém a partícula colada no
     * mesmo ponto da foto em qualquer tamanho de tela.
     */
    const x = ((px + rand()) / width - 0.5) * aspect;
    const y = 0.5 - (py + rand()) / height;

    /**
     * Um punhado se solta do contorno e flutua em volta. São elas que fazem a
     * figura pertencer ao cenário em vez de estar colada na frente dele — e
     * `nx, ny` é a normal da borda, então a fuga é sempre para fora.
     */
    const loose = rand() < 0.34;
    const n = Math.hypot(gx, gy) || 1;
    const drift = loose ? rand() ** 2 * 0.13 : rand() * 0.012;
    const nx = (-gx / n) * drift;
    const ny = (gy / n) * drift;

    const i3 = i * 3;
    positions[i3] = x + nx;
    positions[i3 + 1] = y + ny;
    positions[i3 + 2] = (rand() - 0.5) * 0.05;

    const i4 = i * 4;
    seeds[i4] = rand();
    seeds[i4 + 1] = 0.5 + rand() * 0.5;
    // As soltas são mais fracas: a borda é a linha, o resto é poeira.
    seeds[i4 + 2] = (loose ? 0.3 + rand() * 0.35 : 0.65 + rand() * 0.35) * edge;
    // Quase todas âmbar; poucas queimam para o branco.
    seeds[i4 + 3] = rand() < 0.16 ? 0.55 + rand() * 0.45 : rand() * 0.16;
    i += 1;
  }

  return {
    positions: positions.subarray(0, i * 3),
    seeds: seeds.subarray(0, i * 4),
    count: i,
  };
}
