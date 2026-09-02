/**
 * Nuvem de pontos de um busto humano abstrato.
 *
 * Não é um retrato: é uma presença. A forma é definida por um SDF composto
 * (cabeça · pescoço · ombros) amostrado por rejeição, com viés de superfície —
 * a maioria das partículas fica na casca, algumas ficam no volume, o que dá
 * profundidade sem custo de renderização.
 *
 * Tudo aqui roda uma única vez, na montagem. Nenhum buffer é tocado por frame.
 */

type Vec3 = [number, number, number];

const HEAD_C: Vec3 = [0, 0.98, 0];
const HEAD_R: Vec3 = [0.54, 0.7, 0.58];
const SHOULDER_C: Vec3 = [0, -0.32, -0.02];
const SHOULDER_R: Vec3 = [0.98, 0.46, 0.4];
const NECK_A: Vec3 = [0, 0.24, -0.02];
const NECK_B: Vec3 = [0, 0.62, -0.01];
const NECK_R = 0.185;
const CHEST_CUT = -0.74;
const BLEND = 0.26;

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
  const denom = bax * bax + bay * bay + baz * baz;
  const h = Math.min(1, Math.max(0, (pax * bax + pay * bay + paz * baz) / denom));
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  const dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
}

/** União suave polinomial — evita a costura visível entre cabeça, pescoço e ombros. */
function smin(a: number, b: number, k: number) {
  const h = Math.min(1, Math.max(0, 0.5 + (0.5 * (b - a)) / k));
  return b * (1 - h) + a * h - k * h * (1 - h);
}

/** SDF do busto. Negativo dentro, positivo fora. */
export function bustSDF(x: number, y: number, z: number): number {
  const head = sdEllipsoid(x, y, z, HEAD_C, HEAD_R);
  const neck = sdCapsule(x, y, z, NECK_A, NECK_B, NECK_R);
  const shoulders = sdEllipsoid(x, y, z, SHOULDER_C, SHOULDER_R);

  let d = smin(head, neck, BLEND);
  d = smin(d, shoulders, BLEND * 1.4);

  // Corte inferior reto: o busto termina, não desaparece.
  d = Math.max(d, CHEST_CUT - y);
  return d;
}

function sdfNormal(x: number, y: number, z: number, out: Vec3) {
  const e = 0.012;
  const nx = bustSDF(x + e, y, z) - bustSDF(x - e, y, z);
  const ny = bustSDF(x, y + e, z) - bustSDF(x, y - e, z);
  const nz = bustSDF(x, y, z + e) - bustSDF(x, y, z - e);
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

export type BustCloud = {
  /** Posição alvo (xyz). */
  positions: Float32Array;
  /** Normal do SDF — alimenta a iluminação no vertex shader. */
  normals: Float32Array;
  /** x: semente aleatória · y: variação de tamanho. */
  seeds: Float32Array;
  count: number;
};

const BOUNDS = { x: 1.35, yMin: -0.82, yMax: 1.85, z: 0.78 };

export function createBustCloud(count: number, seed = 20260902): BustCloud {
  const rand = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 2);
  const n: Vec3 = [0, 0, 0];

  let i = 0;
  let guard = 0;
  const maxTries = count * 200;

  while (i < count && guard++ < maxTries) {
    const x = (rand() * 2 - 1) * BOUNDS.x;
    const y = BOUNDS.yMin + rand() * (BOUNDS.yMax - BOUNDS.yMin);
    const z = (rand() * 2 - 1) * BOUNDS.z;

    const d = bustSDF(x, y, z);
    if (d > 0.015) continue;

    // Viés de superfície: casca densa, volume esparso.
    if (rand() > Math.exp(-Math.abs(d) * 11)) continue;

    sdfNormal(x, y, z, n);

    const i3 = i * 3;
    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
    normals[i3] = n[0];
    normals[i3 + 1] = n[1];
    normals[i3 + 2] = n[2];

    const i2 = i * 2;
    seeds[i2] = rand();
    seeds[i2 + 1] = 0.45 + rand() * 0.55;
    i += 1;
  }

  return { positions, normals, seeds, count: i };
}

/** Contagem de partículas por tier (docs/ARCHITECTURE.md §4). */
export const PARTICLES_BY_TIER = {
  high: 120_000,
  mid: 45_000,
  low: 18_000,
  none: 45_000,
} as const;
