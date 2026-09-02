/**
 * Nuvem de pontos de um cérebro — abstrato, não anatômico-ilustrativo.
 *
 * A forma vem de um SDF composto:
 *   · dois hemisférios unidos por `min` (não `smin`) — a junção dura é o que
 *     cria a fissura longitudinal, sem precisar esculpi-la;
 *   · giros e sulcos por deslocamento de ruído senoidal na superfície, que é
 *     o que faz a silhueta ser lida como cérebro e não como ovo;
 *   · cerebelo com estriação mais fina e tronco encefálico.
 *
 * As partículas ficam numa casca fina (|d| < 0.02): pouca densidade, muito
 * volume — o oposto de uma massa sólida.
 *
 * Tudo roda uma vez, na montagem. Nenhum buffer é tocado por frame.
 */

import { fbm3 } from '@/lib/gl/valueNoise';

type Vec3 = [number, number, number];

// x: esquerda-direita · y: baixo-cima · z: trás-frente
const HEMI_OFFSET = 0.28;
const HEMI_C: Vec3 = [0, 0.07, 0.02];
// Mais longo que alto: o crânio visto de perfil é uma elipse deitada, não um
// círculo. Era isso que deixava a silhueta genérica.
const HEMI_R: Vec3 = [0.45, 0.66, 0.97];

/** Lobo temporal: a saliência baixa e frontal que define o perfil do cérebro. */
const TEMPORAL_C: Vec3 = [0.28, -0.3, 0.24];
const TEMPORAL_R: Vec3 = [0.3, 0.23, 0.5];

/** Cerebelo: massa própria, atrás e abaixo, com textura bem mais fina. */
const CEREBELLUM_C: Vec3 = [0, -0.44, -0.66];
const CEREBELLUM_R: Vec3 = [0.42, 0.27, 0.34];

const STEM_A: Vec3 = [0, -0.16, -0.2];
const STEM_B: Vec3 = [0, -0.98, -0.06];
const STEM_R = 0.115;

/** Junções curtas: o vinco entre as partes precisa aparecer. */
const K_TEMPORAL = 0.05;
const K_CEREBELLUM = 0.045;
const K_STEM = 0.05;

function sdEllipsoid(px: number, py: number, pz: number, c: Vec3, r: Vec3) {
  const x = (px - c[0]) / r[0];
  const y = (py - c[1]) / r[1];
  const z = (pz - c[2]) / r[2];
  const k = Math.sqrt(x * x + y * y + z * z);
  return (k - 1) * Math.min(r[0], r[1], r[2]);
}

function sdCapsule(px: number, py: number, pz: number, a: Vec3, b: Vec3, r: number) {
  const pax = px - a[0];
  const pay = py - a[1];
  const paz = pz - a[2];
  const bax = b[0] - a[0];
  const bay = b[1] - a[1];
  const baz = b[2] - a[2];
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  const dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
}

function smin(a: number, b: number, k: number) {
  const h = Math.min(1, Math.max(0, 0.5 + (0.5 * (b - a)) / k));
  return b * (1 - h) + a * h - k * h * (1 - h);
}

/**
 * Campo dos giros, em [0,1]. Perto de 0 está o fundo do sulco; perto de 1, a
 * crista. O seno sobre o fbm produz cristas sinuosas e contínuas — o padrão de
 * dobras, e não manchas aleatórias.
 */
function gyriField(x: number, y: number, z: number): number {
  const w = fbm3(x * 1.55 + 4.3, y * 1.55 + 1.7, z * 1.55 + 9.1, 3);
  // Frequência baixa e amplitude alta: poucas dobras largas e sinuosas, como
  // num cérebro real. Ruído fino lê como textura, não como giro.
  return Math.abs(Math.sin(w * 17 + y * 2.2 + z * 1.1));
}

/**
 * Forma lisa, sem ruído. Barata: é o primeiro filtro da amostragem.
 * O deslocamento dos giros nunca passa de ±0.025, então tudo que interessa
 * está a menos de 0.06 desta superfície.
 */
function brainBaseSDF(x: number, y: number, z: number): number {
  const taper = 1 - Math.max(0, z) * 0.22;
  const r: Vec3 = [HEMI_R[0] * taper, HEMI_R[1], HEMI_R[2]];
  let d = Math.min(
    sdEllipsoid(x + HEMI_OFFSET, y, z, HEMI_C, r),
    sdEllipsoid(x - HEMI_OFFSET, y, z, HEMI_C, r),
  );
  d = smin(d, sdEllipsoid(x - TEMPORAL_C[0], y, z, [0, TEMPORAL_C[1], TEMPORAL_C[2]], TEMPORAL_R), K_TEMPORAL);
  d = smin(d, sdEllipsoid(x + TEMPORAL_C[0], y, z, [0, TEMPORAL_C[1], TEMPORAL_C[2]], TEMPORAL_R), K_TEMPORAL);
  return smin(
    smin(d, sdEllipsoid(x, y, z, CEREBELLUM_C, CEREBELLUM_R), K_CEREBELLUM),
    sdCapsule(x, y, z, STEM_A, STEM_B, STEM_R),
    K_STEM,
  );
}

/** SDF do cérebro. Negativo dentro, positivo fora. */
export function brainSDF(x: number, y: number, z: number): number {
  // Lobo frontal mais estreito que o occipital: o cérebro é uma gota, não um ovo.
  const taper = 1 - Math.max(0, z) * 0.22;

  const left = sdEllipsoid(x + HEMI_OFFSET, y, z, HEMI_C, [
    HEMI_R[0] * taper,
    HEMI_R[1],
    HEMI_R[2],
  ]);
  const right = sdEllipsoid(x - HEMI_OFFSET, y, z, HEMI_C, [
    HEMI_R[0] * taper,
    HEMI_R[1],
    HEMI_R[2],
  ]);

  // União dura: a costura entre os hemisférios É a fissura longitudinal.
  let d = Math.min(left, right);

  // Lobos temporais, um de cada lado. A fissura de Sylvius aparece sozinha na
  // junção suave com o cérebro.
  d = smin(d, sdEllipsoid(x - TEMPORAL_C[0], y, z, [0, TEMPORAL_C[1], TEMPORAL_C[2]], TEMPORAL_R), K_TEMPORAL);
  d = smin(d, sdEllipsoid(x + TEMPORAL_C[0], y, z, [0, TEMPORAL_C[1], TEMPORAL_C[2]], TEMPORAL_R), K_TEMPORAL);

  // Giros e sulcos, mais largos e mais fundos.
  d += (gyriField(x, y, z) - 0.5) * 0.062;

  // Fissura de Sylvius: o sulco profundo que separa o lobo temporal do resto.
  // É um dos marcos que tornam o perfil inconfundível, então é esculpido —
  // não deixado a cargo do ruído.
  //
  // Modelada como um sulco local na superfície lateral (uma cápsula subtraída
  // de cada lado), e não como um plano: um corte plano fatiaria o cérebro
  // inteiro em vez de abrir uma fenda.
  const sylL = sdCapsule(x, y, z, [-0.4, -0.02, 0.56], [-0.4, -0.2, -0.34], 0.075);
  const sylR = sdCapsule(x, y, z, [0.4, -0.02, 0.56], [0.4, -0.2, -0.34], 0.075);
  d = Math.max(d, -Math.min(sylL, sylR));

  // Cerebelo: massa própria, com folia horizontal muito mais fina que os giros.
  let cereb = sdEllipsoid(x, y, z, CEREBELLUM_C, CEREBELLUM_R);
  const folia = Math.abs(Math.sin(y * 44 + z * 9 + fbm3(x * 3.1, y * 3.1, z * 3.1, 2) * 3));
  cereb += (folia - 0.5) * 0.022;

  d = smin(d, cereb, K_CEREBELLUM);
  d = smin(d, sdCapsule(x, y, z, STEM_A, STEM_B, STEM_R), K_STEM);

  return d;
}

function sdfNormal(x: number, y: number, z: number, out: Vec3) {
  const e = 0.008;
  const nx = brainSDF(x + e, y, z) - brainSDF(x - e, y, z);
  const ny = brainSDF(x, y + e, z) - brainSDF(x, y - e, z);
  const nz = brainSDF(x, y, z + e) - brainSDF(x, y, z - e);
  const len = Math.hypot(nx, ny, nz) || 1;
  out[0] = nx / len;
  out[1] = ny / len;
  out[2] = nz / len;
}

/** PRNG determinístico — a mesma nuvem em todo carregamento e em todo tier. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type PointCloud = {
  positions: Float32Array;
  normals: Float32Array;
  /**
   * x: semente e atraso da formação · y: variação de tamanho
   * z: valor do campo de dobras (1 = crista, 0 = fundo do sulco)
   * w: fase, usada por cintilação e deriva
   */
  seeds: Float32Array;
  count: number;
};

const BOUNDS = { x: 0.94, yMin: -1.12, yMax: 0.78, zMin: -1.12, zMax: 1.14 };
const SHELL = 0.02;
const COARSE = 0.07;

export function createBrainCloud(count: number, seed = 20260902): PointCloud {
  const rand = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  const n: Vec3 = [0, 0, 0];

  let i = 0;
  let guard = 0;
  const maxTries = count * 120;

  while (i < count && guard++ < maxTries) {
    const x = (rand() * 2 - 1) * BOUNDS.x;
    const y = BOUNDS.yMin + rand() * (BOUNDS.yMax - BOUNDS.yMin);
    const z = BOUNDS.zMin + rand() * (BOUNDS.zMax - BOUNDS.zMin);

    // Duas fases: descarta a maioria com a forma lisa (sem ruído) e só então
    // paga o fbm nos sobreviventes. Corta o custo de geração em ~5x.
    if (Math.abs(brainBaseSDF(x, y, z)) > COARSE) continue;
    if (Math.abs(brainSDF(x, y, z)) > SHELL) continue;

    /**
     * O campo de dobras vai junto com a partícula. É ele que, no shader,
     * acende as cristas e apaga os sulcos — o padrão de bandas claras e
     * escuras que faz o olho reconhecer um cérebro.
     *
     * A amostragem fica quase uniforme (leve viés para os sulcos, que dá
     * contorno às dobras): o contraste vem da luz, não da densidade. Enviesar
     * demais desenhava só os vales e a forma sumia.
     */
    const gyri = gyriField(x, y, z);
    const groove = 1 - Math.min(1, gyri / 0.4);
    if (rand() > 0.62 + groove * 0.38) continue;

    sdfNormal(x, y, z, n);

    const i3 = i * 3;
    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
    normals[i3] = n[0];
    normals[i3 + 1] = n[1];
    normals[i3 + 2] = n[2];

    const i4 = i * 4;
    seeds[i4] = rand();
    seeds[i4 + 1] = 0.4 + rand() * 0.6;
    seeds[i4 + 2] = gyri;
    seeds[i4 + 3] = rand();
    i += 1;
  }

  return { positions, normals, seeds, count: i };
}

/**
 * A contagem sustenta a leitura das dobras: com o back-face cull, só a metade
 * voltada para a câmera desenha, então metade das partículas é o que aparece.
 * Abaixo disso o padrão de giros se dissolve em poeira.
 */
export const PARTICLES_BY_TIER = {
  high: 95_000,
  mid: 58_000,
  low: 22_000,
  none: 58_000,
} as const;
