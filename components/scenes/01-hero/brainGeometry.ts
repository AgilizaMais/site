/**
 * Geometria do cérebro: forma (SDF) e campos de dobras.
 *
 * Separado do traçado de filamentos para que os dois possam evoluir sozinhos —
 * a forma define a silhueta, o campo define por onde as linhas correm.
 */

import { fbm3 } from '@/lib/gl/valueNoise';

export type Vec3 = [number, number, number];

// Eixos: x esquerda-direita · y baixo-cima · z trás-frente.



/** Eixo da fissura de Sylvius, na face lateral. */
const SYLVIAN_A: Vec3 = [0.44, -0.17, 0.6];
const SYLVIAN_B: Vec3 = [0.44, 0.05, -0.28];
const SYLVIAN_R = 0.05;

/** Cerebelo: massa própria, atrás e abaixo. */
export const CEREBELLUM_C: Vec3 = [0, -0.44, -0.66];
export const CEREBELLUM_R: Vec3 = [0.335, 0.25, 0.33];

/** Tronco encefálico. */
export const STEM_A: Vec3 = [0, -0.24, -0.14];
export const STEM_B: Vec3 = [0, -1.0, -0.02];
export const STEM_R = 0.1;

const K_CEREBELLUM = 0.05;
const K_STEM = 0.05;

export function sdEllipsoid(px: number, py: number, pz: number, c: Vec3, r: Vec3) {
  const x = (px - c[0]) / r[0];
  const y = (py - c[1]) / r[1];
  const z = (pz - c[2]) / r[2];
  const k = Math.sqrt(x * x + y * y + z * z);
  return (k - 1) * Math.min(r[0], r[1], r[2]);
}

export function sdCapsule(px: number, py: number, pz: number, a: Vec3, b: Vec3, r: number) {
  const pax = px - a[0];
  const pay = py - a[1];
  const paz = pz - a[2];
  const bax = b[0] - a[0];
  const bay = b[1] - a[1];
  const baz = b[2] - a[2];
  const h = Math.min(
    1,
    Math.max(0, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)),
  );
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  const dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
}

export function smin(a: number, b: number, k: number) {
  const h = Math.min(1, Math.max(0, 0.5 + (0.5 * (b - a)) / k));
  return b * (1 - h) + a * h - k * h * (1 - h);
}

/** Distância até o eixo da fissura de Sylvius (lado correspondente). */
export function sylvianDistance(x: number, y: number, z: number): number {
  const side = x >= 0 ? 1 : -1;
  return sdCapsule(
    x,
    y,
    z,
    [side * SYLVIAN_A[0], SYLVIAN_A[1], SYLVIAN_A[2]],
    [side * SYLVIAN_B[0], SYLVIAN_B[1], SYLVIAN_B[2]],
    0,
  );
}

/**
 * Perfil lateral do cérebro, no plano (z, y), com o polo frontal em +z.
 *
 * Ajustar elipsoides não produz uma silhueta de cérebro: produz cúpulas e
 * cogumelos. O contorno é o que identifica o órgão, então ele é declarado
 * ponto a ponto — polo frontal, margem superior, polo occipital, face inferior
 * e o lobo temporal pendendo à frente — e depois extrudado em largura.
 */
const PROFILE: ReadonlyArray<readonly [number, number]> = [
  [0.93, 0.14],
  [0.87, 0.35],
  [0.7, 0.52],
  [0.44, 0.61],
  [0.14, 0.64],
  [-0.2, 0.61],
  [-0.5, 0.51],
  [-0.73, 0.34],
  [-0.87, 0.11],
  [-0.9, -0.1],
  [-0.79, -0.24],
  [-0.6, -0.29],
  [-0.42, -0.29],
  [-0.26, -0.33],
  [-0.1, -0.42],
  [0.1, -0.5],
  [0.3, -0.55],
  [0.48, -0.54],
  [0.62, -0.46],
  [0.7, -0.33],
  [0.75, -0.17],
  [0.85, -0.02],
];

/** Distância com sinal a um polígono fechado, no plano (z, y). */
function sdProfile(z: number, y: number): number {
  const n = PROFILE.length;
  let d = Infinity;
  let sign = 1;

  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    const a = PROFILE[i]!;
    const b = PROFILE[j]!;
    const ez = b[0] - a[0];
    const ey = b[1] - a[1];
    const wz = z - a[0];
    const wy = y - a[1];
    const t = Math.min(1, Math.max(0, (wz * ez + wy * ey) / (ez * ez + ey * ey)));
    const cz = wz - ez * t;
    const cy = wy - ey * t;
    d = Math.min(d, cz * cz + cy * cy);

    // Regra do número de cruzamentos, para o sinal.
    const c1 = y >= a[1];
    const c2 = y < b[1];
    const c3 = ez * wy > ey * wz;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) sign = -sign;
  }

  return sign * Math.sqrt(d);
}

/** Meia-largura do órgão em cada ponto do perfil: as extremidades afinam. */
function halfWidth(z: number, y: number): number {
  const a = z / 1.05;
  const b = (y - 0.05) / 0.86;
  const k = Math.max(0, 1 - a * a * 0.62 - b * b * 0.5);
  return 0.44 * Math.sqrt(k);
}

/** Só o cérebro: perfil extrudado, fissura longitudinal e fissura de Sylvius. */
export function sdCerebrum(x: number, y: number, z: number): number {
  const d2 = sdProfile(z, y) - 0.05;
  const wx = Math.abs(x) - halfWidth(z, y);

  // Extrusão arredondada (Inigo Quilez): combina o perfil 2D com a largura.
  const outside = Math.hypot(Math.max(d2, 0), Math.max(wx, 0));
  let d = Math.min(Math.max(d2, wx), 0) + outside - 0.035;

  // Fissura longitudinal: sulco raso na linha média superior.
  const longitudinal = sdCapsule(x, y, z, [0, 0.7, 0.9], [0, 0.7, -0.9], 0.055);
  d = Math.max(d, -longitudinal);

  // Fissura de Sylvius, escavada na face lateral: a cintura que separa o lobo
  // temporal e o marco que faz o perfil ser reconhecido como cérebro.
  const side = x >= 0 ? 1 : -1;
  const syl = sdCapsule(
    x,
    y,
    z,
    [side * SYLVIAN_A[0], SYLVIAN_A[1], SYLVIAN_A[2]],
    [side * SYLVIAN_B[0], SYLVIAN_B[1], SYLVIAN_B[2]],
    SYLVIAN_R,
  );
  d = Math.max(d, -syl);

  return d;
}

export function sdCerebellum(x: number, y: number, z: number): number {
  return sdEllipsoid(x, y, z, CEREBELLUM_C, CEREBELLUM_R);
}

export function sdStem(x: number, y: number, z: number): number {
  return sdCapsule(x, y, z, STEM_A, STEM_B, STEM_R);
}

/** Forma lisa completa. É sobre ela que os filamentos são traçados. */
export function brainSDF(x: number, y: number, z: number): number {
  let d = sdCerebrum(x, y, z);
  d = smin(d, sdCerebellum(x, y, z), K_CEREBELLUM);
  d = smin(d, sdStem(x, y, z), K_STEM);

  // Fissura transversa: a fenda entre o lobo occipital e o cerebelo. Sem ela
  // as duas massas se fundem e o cerebelo deixa de existir como corpo próprio.
  const fissure = sdCapsule(x, y, z, [-0.6, -0.16, -0.5], [0.6, -0.16, -0.5], 0.035);
  d = Math.max(d, -fissure);

  return d;
}

// ---------------------------------------------------------------------------
// Campo de dobras
// ---------------------------------------------------------------------------

/**
 * Fase contínua dos giros do cérebro.
 *
 * As linhas de nível desta função SÃO os giros: traçá-las produz filamentos
 * contínuos, em vez de pontos filtrados por densidade.
 *
 * A construção é a de um mapa de contorno: um campo de ruído com uma tendência
 * linear suave. As curvas de nível de um campo assim são bandas irregulares que
 * serpenteiam e se fecham — exatamente o comportamento dos giros.
 *
 * Foram testadas e descartadas duas alternativas: faixas paralelas puras (leem
 * como listras) e um campo polar em torno da fissura de Sylvius (todos os arcos
 * convergem para um foco visível, e o padrão lê como leque).
 */
export function cerebrumPhase(x: number, y: number, z: number): number {
  const n1 = fbm3(x * 1.9 + 4.3, y * 1.9 + 1.7, z * 1.9 + 9.1, 3) * 2 - 1;
  const n2 = fbm3(x * 4.1 + 21.0, y * 4.1 + 33.0, z * 4.1 + 7.0, 2) * 2 - 1;

  // A tendência linear dá a direção geral das dobras — obliqua, subindo da
  // fissura de Sylvius em direção ao vértice. O ruído dá a sinuosidade.
  // O termo em x separa o padrão dos dois hemisférios: sem ele, as linhas
  // atravessam a fissura longitudinal como se fosse superfície contínua.
  // A tendência linear precisa ser MAIOR que o gradiente do ruído. Abaixo
  // disso as curvas de nível se fecham em ilhas concêntricas e o resultado lê
  // como mapa topográfico; acima, correm como bandas longas e sinuosas — que é
  // o comportamento dos giros.
  return (n1 * 30 + n2 * 7 + y * 62 + z * 17 + Math.abs(x) * 12) * 1.45;
}

/**
 * Fase das folia do cerebelo: arcos concêntricos, muito mais finos e regulares
 * que os giros. É essa diferença de textura que separa as duas massas a olho.
 */
export function cerebellumPhase(x: number, y: number, z: number): number {
  const dy = (y - CEREBELLUM_C[1]) / CEREBELLUM_R[1];
  const dz = (z - CEREBELLUM_C[2]) / CEREBELLUM_R[2];
  // Distância, e não ângulo: ângulo produz um leque com foco no centro;
  // distância produz os arcos aninhados que o cerebelo de fato tem.
  const n = fbm3(x * 3.4 + 31.0, y * 3.4 + 5.0, z * 3.4 + 17.0, 2) * 2 - 1;
  // Ruído forte o bastante para quebrar o anel perfeito: círculos concêntricos
  // exatos leem como alvo, não como cerebelo.
  // Folia como faixas paralelas que envolvem a massa, e não anéis concêntricos:
  // anéis exatos leem como alvo. A tendência é vertical, com o ruído dando a
  // ondulação e o termo em z inclinando as faixas para trás.
  return dy * 128 + dz * 34 + n * 22 + Math.abs(x) * 28;
}

/** Fase do tronco: linhas longitudinais, acompanhando o eixo. */
export function stemPhase(x: number, y: number, z: number): number {
  const ang = Math.atan2(x, z - STEM_B[2]);
  const n = fbm3(x * 4 + 7, y * 4 + 13, z * 4 + 29, 1) * 2 - 1;
  return (ang * 7.0 + n * 0.5) * 1.6;
}
