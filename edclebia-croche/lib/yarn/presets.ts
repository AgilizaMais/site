/**
 * Composições de fios. Coordenadas normalizadas ao canvas:
 *   nx: 0 (esquerda) → 1 (direita) · ny: 0 (topo) → 1 (base) · z em unidades de mundo
 *   (z < 0 passa por trás da foto da modelo, z > 0 passa pela frente).
 * Raios em px CSS — o motor converte para o mundo a cada resize.
 */

export type V3 = [number, number, number];

export type ThreadDef = {
  pts: V3[];
  /** Estado alternativo (mesmo número de pontos) — interpolado por `progress`. */
  ptsB?: V3[];
  radius: number;
  colA: string;
  colB: string;
  kind: 'ply' | 'cord';
  /** cabos (fio) ou colunas de pontos (cordão) */
  plies?: number;
  /** ângulo da hélice, rad */
  twist?: number;
  /** amplitude da ondulação (fração da altura) */
  amp?: number;
  speed?: number;
  phase?: number;
  /** velocidade com que o fio "desliza" no próprio eixo */
  flow?: number;
  taper?: number;
  /** atraso na animação de entrada (0..1) */
  delay?: number;
};

export type DoilyDef = {
  nx: number;
  ny: number;
  /** diâmetro em fração da altura do canvas */
  size: number;
  z: number;
  colA: string;
  colB: string;
  opacity: number;
  spin: number;
};

export type SceneDef = { threads: ThreadDef[]; doilies: DoilyDef[] };

export const C = {
  pink: '#E8447C',
  pinkDeep: '#C42A62',
  hot: '#F2568E',
  rose: '#F49AB9',
  roseDeep: '#E27BA0',
  lilac: '#7A5BC9',
  lilacDeep: '#5A3FA6',
  violet: '#9C80E4',
  cream: '#F3E4CF',
  creamDeep: '#E2CBAE',
  gold: '#D9A84C',
};

/** Laço em forma de coração inserido no caminho de um fio. */
function heartLoop(cx: number, cy: number, size: number, aspect: number, n = 16, rot = 0, z = 0): V3[] {
  const out: V3[] = [];
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);
  for (let i = 0; i <= n; i++) {
    const t = Math.PI + (i / n) * Math.PI * 2;
    const hx = (16 * Math.pow(Math.sin(t), 3)) / 17;
    const hy = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17;
    const x = hx * cr - hy * sr;
    const y = hx * sr + hy * cr;
    out.push([cx + (x * size) / aspect, cy - y * size, z + Math.sin(t * 2) * 0.12]);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* HERO                                                                */
/* ------------------------------------------------------------------ */

function heroDesktop(aspect: number): SceneDef {
  const heart = heartLoop(0.555, 0.215, 0.058, aspect, 14, 0.12, -0.2);
  return {
    threads: [
      // fio rosa com laço de coração, por trás da modelo
      {
        pts: [[-0.08, 0.13, -0.3], [0.1, 0.118, -0.3], [0.26, 0.128, -0.25], [0.4, 0.15, -0.2], [0.48, 0.2, -0.2], ...heart, [0.64, 0.24, -0.4], [0.76, 0.17, -0.5], [0.9, 0.22, -0.5], [1.1, 0.14, -0.5]],
        radius: 2.7, colA: C.pink, colB: C.pinkDeep, kind: 'ply', plies: 3, amp: 0.012, speed: 0.55, phase: 0.2, flow: 0.12, delay: 0.05,
      },
      // lilás fino, cruza pela frente
      {
        pts: [[-0.08, 0.5, 0.5], [0.12, 0.555, 0.5], [0.3, 0.48, 0.55], [0.5, 0.57, 0.6], [0.66, 0.5, 0.7], [0.82, 0.58, 0.6], [1.1, 0.46, 0.5]],
        radius: 2.4, colA: C.lilac, colB: C.lilacDeep, kind: 'ply', plies: 3, amp: 0.016, speed: 0.48, phase: 1.3, flow: -0.1, delay: 0.12,
      },
      // rosa médio, sobe varrendo pela frente
      {
        pts: [[-0.08, 0.9, 0.9], [0.15, 0.82, 0.9], [0.36, 0.88, 1.0], [0.55, 0.72, 1.1], [0.72, 0.64, 1.1], [0.88, 0.68, 1.0], [1.1, 0.53, 0.9]],
        radius: 4.2, colA: C.hot, colB: C.pink, kind: 'ply', plies: 4, amp: 0.014, speed: 0.42, phase: 2.1, flow: 0.08, delay: 0.2,
      },
      // lilás médio, por trás
      {
        pts: [[0.67, -0.12, -0.9], [0.635, 0.12, -0.9], [0.62, 0.34, -0.8], [0.72, 0.45, -0.8], [0.86, 0.34, -0.9], [1.1, 0.4, -0.9]],
        radius: 3.6, colA: C.violet, colB: C.lilac, kind: 'ply', plies: 3, amp: 0.018, speed: 0.38, phase: 3.0, flow: 0.06, delay: 0.28,
      },
      // rosê claro, fino
      {
        pts: [[-0.08, 0.7, 0.3], [0.1, 0.685, 0.3], [0.25, 0.66, 0.35], [0.42, 0.7, 0.4], [0.62, 0.78, 0.2], [0.8, 0.72, 0.2], [1.1, 0.8, 0.2]],
        radius: 2.0, colA: C.rose, colB: C.roseDeep, kind: 'ply', plies: 3, amp: 0.02, speed: 0.5, phase: 4.2, flow: -0.14, delay: 0.16,
      },
      // lilás fino alto, ao fundo
      {
        pts: [[0.62, -0.12, -1.2], [0.66, 0.04, -1.2], [0.74, 0.14, -1.2], [0.86, 0.1, -1.2], [1.1, 0.15, -1.2]],
        radius: 2.0, colA: C.violet, colB: C.lilacDeep, kind: 'ply', plies: 3, amp: 0.012, speed: 0.36, phase: 5.1, flow: 0.1, delay: 0.0,
      },
      // fio cru (off-white) — conversa com o vestido
      {
        pts: [[0.42, 1.1, 0.6], [0.52, 0.94, 0.6], [0.64, 0.86, 0.7], [0.8, 0.9, 0.7], [0.94, 0.84, 0.6], [1.1, 0.88, 0.6]],
        radius: 2.6, colA: C.cream, colB: C.creamDeep, kind: 'ply', plies: 4, amp: 0.014, speed: 0.4, phase: 0.7, flow: 0.1, delay: 0.34,
      },
      // cordões grossos de pontos — primeiro plano
      {
        pts: [[0.5, 1.2, 1.6], [0.66, 0.99, 1.6], [0.8, 0.88, 1.5], [0.94, 0.83, 1.5], [1.14, 0.88, 1.4]],
        radius: 13, colA: C.pink, colB: C.hot, kind: 'cord', plies: 5, amp: 0.01, speed: 0.32, phase: 1.1, flow: 0.05, delay: 0.42,
      },
      {
        pts: [[0.28, 1.18, 1.2], [0.48, 1.04, 1.25], [0.7, 1.0, 1.3], [0.9, 1.02, 1.3], [1.14, 0.95, 1.3]],
        radius: 10, colA: C.lilac, colB: C.violet, kind: 'cord', plies: 5, amp: 0.008, speed: 0.3, phase: 2.6, flow: -0.04, delay: 0.5,
      },
      {
        pts: [[0.99, -0.12, 1.1], [1.0, 0.1, 1.1], [1.05, 0.2, 1.1], [1.16, 0.24, 1.1]],
        radius: 11, colA: C.pink, colB: C.pinkDeep, kind: 'cord', plies: 5, amp: 0.008, speed: 0.34, phase: 3.7, flow: 0.04, delay: 0.46,
      },
    ],
    doilies: [
      { nx: -0.075, ny: 0.4, size: 0.36, z: -2.4, colA: C.lilac, colB: C.violet, opacity: 0.95, spin: 0.03 },
      { nx: 1.0, ny: 0.9, size: 0.6, z: -2.6, colA: C.pink, colB: C.hot, opacity: 0.92, spin: -0.02 },
      { nx: 0.3, ny: 0.86, size: 0.5, z: -3.2, colA: C.cream, colB: C.creamDeep, opacity: 0.2, spin: 0.015 },
    ],
  };
}

function heroMobile(aspect: number): SceneDef {
  const heart = heartLoop(0.5, 0.115, 0.024, aspect, 14, 0.1, 0.2);
  return {
    threads: [
      {
        pts: [[-0.12, 0.13, 0.2], [0.12, 0.1, 0.2], [0.32, 0.125, 0.2], [0.44, 0.13, 0.2], ...heart, [0.6, 0.12, 0.2], [0.8, 0.14, 0.2], [1.12, 0.1, 0.2]],
        radius: 2.2, colA: C.pink, colB: C.pinkDeep, kind: 'ply', plies: 3, amp: 0.006, speed: 0.55, phase: 0.2, flow: 0.12, delay: 0.05,
      },
      {
        pts: [[-0.12, 0.75, -0.7], [0.25, 0.73, -0.7], [0.55, 0.63, -0.7], [0.8, 0.58, -0.7], [1.12, 0.6, -0.7]],
        radius: 2.4, colA: C.violet, colB: C.lilac, kind: 'ply', plies: 3, amp: 0.008, speed: 0.45, phase: 1.4, flow: -0.08, delay: 0.15,
      },
      {
        pts: [[-0.12, 0.665, 0.6], [0.3, 0.645, 0.6], [0.55, 0.53, 0.7], [0.8, 0.45, 0.6], [1.12, 0.41, 0.6]],
        radius: 2.2, colA: C.lilac, colB: C.lilacDeep, kind: 'ply', plies: 3, amp: 0.008, speed: 0.5, phase: 2.2, flow: 0.1, delay: 0.22,
      },
      {
        pts: [[-0.12, 0.8, 0.9], [0.22, 0.765, 0.9], [0.5, 0.79, 1.0], [0.78, 0.72, 1.0], [1.12, 0.76, 0.9]],
        radius: 3.6, colA: C.hot, colB: C.pink, kind: 'ply', plies: 4, amp: 0.008, speed: 0.42, phase: 3.0, flow: 0.08, delay: 0.3,
      },
      {
        pts: [[-0.12, 0.86, 0.3], [0.3, 0.83, 0.3], [0.62, 0.87, 0.3], [1.12, 0.81, 0.3]],
        radius: 1.8, colA: C.rose, colB: C.roseDeep, kind: 'ply', plies: 3, amp: 0.008, speed: 0.5, phase: 4.1, flow: -0.12, delay: 0.26,
      },
      {
        pts: [[-0.2, 0.7, 1.4], [0.1, 0.75, 1.4], [0.36, 0.8, 1.4], [0.62, 0.86, 1.4], [0.9, 0.88, 1.4], [1.2, 0.86, 1.4]],
        radius: 9, colA: C.pink, colB: C.hot, kind: 'cord', plies: 5, amp: 0.006, speed: 0.32, phase: 1.1, flow: 0.05, delay: 0.4,
      },
      {
        pts: [[1.25, 0.36, 1.2], [1.02, 0.44, 1.2], [0.94, 0.52, 1.2], [1.0, 0.6, 1.2], [1.25, 0.66, 1.2]],
        radius: 7.5, colA: C.lilac, colB: C.violet, kind: 'cord', plies: 5, amp: 0.006, speed: 0.3, phase: 2.4, flow: -0.04, delay: 0.48,
      },
    ],
    doilies: [
      { nx: -0.12, ny: 0.7, size: 0.2, z: -2.4, colA: C.lilac, colB: C.violet, opacity: 0.9, spin: 0.03 },
      { nx: 1.06, ny: 0.78, size: 0.26, z: -2.6, colA: C.pink, colB: C.hot, opacity: 0.85, spin: -0.02 },
    ],
  };
}

export function heroScene(aspect: number): SceneDef {
  return aspect >= 0.95 ? heroDesktop(aspect) : heroMobile(aspect);
}

/* ------------------------------------------------------------------ */
/* CORAÇÃO (seção "A marca") — fios soltos que se enrolam no logo      */
/* ------------------------------------------------------------------ */

function windings(
  aspect: number,
  cx: number,
  cy: number,
  size: number,
  count: number,
  z: number,
  colors: [string, string][],
  radius: number,
  seedY: number,
  fromLeft: boolean,
  wide: boolean,
): ThreadDef[] {
  const out: ThreadDef[] = [];
  for (let k = 0; k < count; k++) {
    const s = size * (1 - k * (0.62 / count));
    const rot = (k % 2 === 0 ? 1 : -1) * 0.06 * k;
    const loop = heartLoop(cx, cy + k * size * 0.03, s, aspect, 18, rot, z + k * 0.06);
    const first = loop[0]!;
    const last = loop[loop.length - 1]!;
    // pontas: nada cruza a coluna de texto.
    // largo: rosa entra pela esquerda, lilás sobe por baixo · estreito: tudo sai pelas laterais
    let inA: V3, inB: V3, outB: V3, outA: V3;
    if (wide) {
      inA = fromLeft ? [-0.15, cy + 0.25 + k * 0.05, z] : [cx + 0.02 + k * 0.035, 1.2, z];
      inB = fromLeft
        ? [(inA[0] + first[0]) / 2, (inA[1] + first[1]) / 2 + 0.06, z]
        : [first[0] + 0.04, (first[1] + 1.2) / 2, z];
      outB = [last[0] + (fromLeft ? 0.04 : -0.04), last[1] + 0.1, z];
      outA = [fromLeft ? cx + 0.05 + k * 0.03 : cx - 0.2 - k * 0.05, 1.2, z];
    } else {
      const side = fromLeft ? -0.18 : 1.18;
      inA = [side, first[1] - 0.02 + k * 0.006, z];
      inB = [(side + first[0]) / 2, first[1] + 0.025, z];
      outB = [(side + last[0]) / 2 + (fromLeft ? 0.05 : -0.05), last[1] + 0.03, z];
      outA = [side, last[1] + 0.035 + k * 0.006, z];
    }
    const B = [inA, inB, ...loop, outB, outA];

    // estado solto: ondas horizontais atravessando a seção
    const n = B.length;
    const A: V3[] = B.map((_, i) => {
      const u = i / (n - 1);
      const x = -0.15 + u * 1.3;
      const y = seedY + k * 0.07 + Math.sin(u * Math.PI * 2.2 + k * 1.3) * 0.05;
      return [x, y, z + Math.sin(u * 7 + k) * 0.3];
    });
    const col = colors[k % colors.length]!;
    out.push({
      pts: A,
      ptsB: B,
      radius: radius * (1 - k * 0.06),
      colA: col[0],
      colB: col[1],
      kind: 'ply',
      plies: k % 2 === 0 ? 3 : 4,
      amp: 0.012,
      speed: 0.4 + k * 0.05,
      phase: k * 1.7 + (fromLeft ? 0 : 3),
      flow: (k % 2 === 0 ? 1 : -1) * 0.1,
      delay: k * 0.06,
    });
  }
  return out;
}

export function heartScene(aspect: number): SceneDef {
  const wide = aspect >= 0.95;
  const cx = wide ? 0.215 : 0.42;
  const cy = wide ? 0.47 : 0.18;
  const size = wide ? 0.25 : 0.115;
  const pinks: [string, string][] = [
    [C.pink, C.pinkDeep],
    [C.hot, C.pink],
    [C.rose, C.roseDeep],
    [C.pink, C.hot],
    [C.roseDeep, C.pinkDeep],
  ];
  const lilacs: [string, string][] = [
    [C.lilac, C.lilacDeep],
    [C.violet, C.lilac],
    [C.lilacDeep, C.violet],
  ];
  const pinkThreads = windings(aspect, cx, cy, size, 5, 0.2, pinks, wide ? 4.2 : 3.2, wide ? 0.3 : 0.16, true, wide);
  const lilacThreads = windings(
    aspect,
    cx + (size * 0.7) / aspect,
    cy + size * 0.14,
    size * 0.64,
    3,
    -0.5,
    lilacs,
    wide ? 3.8 : 2.8,
    wide ? 0.62 : 0.26,
    false,
    wide,
  );
  return {
    threads: [...lilacThreads, ...pinkThreads],
    doilies: [],
  };
}
