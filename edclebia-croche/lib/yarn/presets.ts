/**
 * Composições de fios. Coordenadas normalizadas ao canvas:
 *   nx: 0 (esquerda) → 1 (direita) · ny: 0 (topo) → 1 (base) · z em unidades de mundo
 *   (z < 0 passa por trás da foto da modelo, z > 0 passa pela frente).
 * Raios em px CSS — o motor converte para o mundo a cada resize.
 *
 * Menos é mais: poucos fios, bem posicionados, longe dos textos.
 */

export type V3 = [number, number, number];

export type ThreadDef = {
  pts: V3[];
  /** Estado alternativo (mesmo número de pontos) — interpolado por `progress`. */
  ptsB?: V3[];
  /**
   * Trecho [início, fim] de pontos que ondula como um bloco só — o laço do coração
   * não se deforma com as ondas do resto do fio.
   */
  rigid?: [number, number];
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
};

/**
 * Coração desenhado por um fio de verdade (como no rascunho à mão):
 * o fio chega pela esquerda, sobe pelo lado direito, contorna o lobo,
 * faz um laço pendurado no meio do topo, contorna o lobo esquerdo, desce
 * e cruza por cima de si mesmo na ponta — sem bico, sem dobra de arame —
 * e segue para a direita.
 * Coordenadas locais: x → direita, y → cima, coração em [-1, 1].
 */
const HEART: V3[] = [
  [-1.05, -1.1, 0],
  [-0.52, -1.0, 0.05],
  [0.0, -0.7, 0.2], // cruzamento (passa por cima)
  [0.44, -0.28, 0.12],
  [0.8, 0.2, 0.05],
  [0.86, 0.64, 0],
  [0.64, 0.94, -0.04],
  [0.36, 0.98, -0.05],
  [0.14, 0.86, 0],
  [-0.04, 0.66, 0.08], // laço pendurado no topo
  [0.02, 0.47, 0.12],
  [0.2, 0.55, 0.1],
  [0.18, 0.75, 0.04],
  [-0.04, 0.9, -0.06],
  [-0.3, 0.99, -0.05],
  [-0.62, 0.95, -0.03],
  [-0.86, 0.66, 0],
  [-0.88, 0.22, 0.03],
  [-0.56, -0.25, 0],
  [0.0, -0.7, -0.2], // cruzamento (passa por baixo)
  [0.52, -1.0, -0.05],
  [1.05, -1.1, 0],
];

function heartLoop(cx: number, cy: number, size: number, aspect: number, rot = 0, z = 0, zScale = 1): V3[] {
  const cr = Math.cos(rot);
  const sr = Math.sin(rot);
  return HEART.map(([hx, hy, hz]) => {
    const x = hx * cr - hy * sr;
    const y = hx * sr + hy * cr;
    return [cx + (x * size) / aspect, cy - y * size, z + hz * zScale];
  });
}

/** Junta trechos e devolve o fio + o intervalo do coração (para ondular em bloco). */
function withHeart(before: V3[], heart: V3[], after: V3[]): { pts: V3[]; rigid: [number, number] } {
  return { pts: [...before, ...heart, ...after], rigid: [before.length, before.length + heart.length - 1] };
}

/* ------------------------------------------------------------------ */
/* HERO                                                                */
/* ------------------------------------------------------------------ */

function heroDesktop(aspect: number): SceneDef {
  const h = withHeart(
    [[-0.08, 0.15, -0.3], [0.12, 0.13, -0.3], [0.3, 0.152, -0.25], [0.43, 0.245, -0.2]],
    heartLoop(0.555, 0.195, 0.068, aspect, 0.06, -0.2),
    [[0.68, 0.262, -0.4], [0.8, 0.19, -0.5], [0.92, 0.22, -0.5], [1.1, 0.15, -0.5]],
  );
  return {
    threads: [
      // fio rosa com o coração, passando por trás da modelo
      {
        ...h,
        radius: 2.8, colA: C.pink, colB: C.pinkDeep, kind: 'ply', plies: 3, amp: 0.007, speed: 0.5, phase: 0.2, flow: 0.1, delay: 0.05,
      },
      // lilás fino, cruza pela frente (entre o subtítulo e os botões)
      {
        pts: [[-0.08, 0.5, 0.5], [0.12, 0.555, 0.5], [0.3, 0.48, 0.55], [0.5, 0.57, 0.6], [0.66, 0.5, 0.7], [0.82, 0.58, 0.6], [1.1, 0.46, 0.5]],
        radius: 2.4, colA: C.lilac, colB: C.lilacDeep, kind: 'ply', plies: 3, amp: 0.014, speed: 0.45, phase: 1.3, flow: -0.1, delay: 0.15,
      },
      // rosa médio, sobe varrendo pela frente
      {
        pts: [[-0.08, 0.9, 0.9], [0.15, 0.82, 0.9], [0.36, 0.88, 1.0], [0.55, 0.72, 1.1], [0.72, 0.64, 1.1], [0.88, 0.68, 1.0], [1.1, 0.53, 0.9]],
        radius: 4.2, colA: C.hot, colB: C.pink, kind: 'ply', plies: 4, amp: 0.012, speed: 0.4, phase: 2.1, flow: 0.08, delay: 0.25,
      },
      // lilás médio, por trás da modelo
      {
        pts: [[0.75, -0.12, -0.9], [0.735, 0.1, -0.9], [0.72, 0.32, -0.8], [0.8, 0.45, -0.8], [0.9, 0.36, -0.9], [1.1, 0.42, -0.9]],
        radius: 3.4, colA: C.violet, colB: C.lilac, kind: 'ply', plies: 3, amp: 0.016, speed: 0.36, phase: 3.0, flow: 0.06, delay: 0.32,
      },
      // cordões grossos de pontos — primeiro plano, canto inferior direito
      {
        pts: [[0.5, 1.2, 1.6], [0.66, 0.99, 1.6], [0.8, 0.88, 1.5], [0.94, 0.83, 1.5], [1.14, 0.88, 1.4]],
        radius: 13, colA: C.pink, colB: C.hot, kind: 'cord', plies: 5, amp: 0.008, speed: 0.3, phase: 1.1, flow: 0.05, delay: 0.42,
      },
      {
        pts: [[0.3, 1.18, 1.2], [0.5, 1.04, 1.25], [0.7, 1.0, 1.3], [0.9, 1.02, 1.3], [1.14, 0.95, 1.3]],
        radius: 10, colA: C.lilac, colB: C.violet, kind: 'cord', plies: 5, amp: 0.007, speed: 0.28, phase: 2.6, flow: -0.04, delay: 0.5,
      },
    ],
    doilies: [
      { nx: -0.08, ny: 0.74, size: 0.32, z: -2.4, colA: C.lilac, colB: C.violet, opacity: 0.85, spin: 0.03 },
      { nx: 1.0, ny: 0.9, size: 0.6, z: -2.6, colA: C.pink, colB: C.hot, opacity: 0.9, spin: -0.02 },
    ],
  };
}

function heroMobile(aspect: number): SceneDef {
  const h = withHeart(
    [[-0.12, 0.15, 0.2], [0.12, 0.13, 0.2], [0.28, 0.148, 0.2], [0.38, 0.158, 0.2]],
    heartLoop(0.5, 0.122, 0.032, aspect, 0.05, 0.2, 0.6),
    [[0.64, 0.16, 0.2], [0.82, 0.14, 0.2], [1.12, 0.12, 0.2]],
  );
  return {
    threads: [
      {
        ...h,
        radius: 2.3, colA: C.pink, colB: C.pinkDeep, kind: 'ply', plies: 3, amp: 0.005, speed: 0.5, phase: 0.2, flow: 0.1, delay: 0.05,
      },
      {
        pts: [[-0.12, 0.75, -0.7], [0.25, 0.73, -0.7], [0.55, 0.63, -0.7], [0.8, 0.58, -0.7], [1.12, 0.6, -0.7]],
        radius: 2.4, colA: C.violet, colB: C.lilac, kind: 'ply', plies: 3, amp: 0.007, speed: 0.45, phase: 1.4, flow: -0.08, delay: 0.15,
      },
      {
        pts: [[-0.12, 0.665, 0.6], [0.3, 0.645, 0.6], [0.55, 0.53, 0.7], [0.8, 0.45, 0.6], [1.12, 0.41, 0.6]],
        radius: 2.2, colA: C.lilac, colB: C.lilacDeep, kind: 'ply', plies: 3, amp: 0.007, speed: 0.5, phase: 2.2, flow: 0.1, delay: 0.22,
      },
      {
        pts: [[-0.12, 0.8, 0.9], [0.22, 0.765, 0.9], [0.5, 0.79, 1.0], [0.78, 0.72, 1.0], [1.12, 0.76, 0.9]],
        radius: 3.6, colA: C.hot, colB: C.pink, kind: 'ply', plies: 4, amp: 0.007, speed: 0.42, phase: 3.0, flow: 0.08, delay: 0.3,
      },
      {
        pts: [[-0.2, 0.72, 1.4], [0.1, 0.77, 1.4], [0.36, 0.82, 1.4], [0.62, 0.87, 1.4], [0.9, 0.89, 1.4], [1.2, 0.87, 1.4]],
        radius: 9, colA: C.pink, colB: C.hot, kind: 'cord', plies: 5, amp: 0.005, speed: 0.3, phase: 1.1, flow: 0.05, delay: 0.4,
      },
    ],
    doilies: [{ nx: 1.08, ny: 0.8, size: 0.24, z: -2.6, colA: C.pink, colB: C.hot, opacity: 0.85, spin: -0.02 }],
  };
}

export function heroScene(aspect: number): SceneDef {
  return aspect >= 0.95 ? heroDesktop(aspect) : heroMobile(aspect);
}

/* ------------------------------------------------------------------ */
/* CORAÇÃO (seção "A marca") — fios soltos que viram os corações do logo */
/* ------------------------------------------------------------------ */

function heartThreads(
  aspect: number,
  wide: boolean,
  cx: number,
  cy: number,
  size: number,
  z: number,
  colors: [string, string][],
  radius: number,
  seedY: number,
  inFrom: V3,
): ThreadDef[] {
  return colors.map((col, k) => {
    const s = size * (1 - k * 0.17);
    const loop = heartLoop(cx + k * 0.006, cy + k * size * 0.1, s, aspect, (k % 2 ? -1 : 1) * 0.05, z + k * 0.08);
    const first = loop[0]!;
    const last = loop[loop.length - 1]!;
    // chega pela esquerda e sai pela direita, sempre em curva suave
    const inA: V3 = [inFrom[0], inFrom[1] + k * 0.03, z];
    const inB: V3 = [(inA[0] + first[0]) / 2, (inA[1] + first[1]) / 2 + (wide ? 0.03 : 0.01), z];
    const outB: V3 = wide ? [last[0] + 0.035, last[1] + 0.07, z] : [last[0] + 0.12, last[1] + 0.01, z];
    const outA: V3 = wide ? [last[0] + 0.02 + k * 0.02, 1.2, z] : [1.2, last[1] + 0.02 + k * 0.01, z];
    const B: V3[] = [inA, inB, ...loop, outB, outA];

    // estado solto: ondas horizontais atravessando a seção
    const n = B.length;
    const A: V3[] = B.map((_, i) => {
      const u = i / (n - 1);
      return [-0.15 + u * 1.3, seedY + k * 0.06 + Math.sin(u * Math.PI * 2.2 + k * 1.3) * 0.045, z + Math.sin(u * 7 + k) * 0.3];
    });

    return {
      pts: A,
      ptsB: B,
      rigid: [2, 2 + loop.length - 1] as [number, number],
      radius: radius * (1 - k * 0.08),
      colA: col[0],
      colB: col[1],
      kind: 'ply' as const,
      plies: k % 2 === 0 ? 3 : 4,
      amp: 0.012,
      speed: 0.4 + k * 0.05,
      phase: k * 1.7 + z * 3,
      flow: (k % 2 === 0 ? 1 : -1) * 0.1,
      delay: k * 0.08,
    };
  });
}

export function heartScene(aspect: number): SceneDef {
  const wide = aspect >= 0.95;
  const cx = wide ? 0.19 : 0.4;
  const cy = wide ? 0.44 : 0.17;
  const size = wide ? 0.25 : 0.11;
  const lx = cx + (size * (wide ? 0.74 : 0.82)) / aspect;
  const ly = cy + size * 0.18;
  const pink = heartThreads(
    aspect, wide, cx, cy, size, 0.25,
    [[C.pink, C.pinkDeep], [C.rose, C.roseDeep]],
    wide ? 4.4 : 3.2, wide ? 0.32 : 0.15,
    wide ? [-0.15, cy + size * 1.25, 0] : [-0.18, cy + size * 1.15, 0],
  );
  const lilac = heartThreads(
    aspect, wide, lx, ly, size * 0.68, -0.5,
    [[C.lilac, C.lilacDeep], [C.violet, C.lilac]],
    wide ? 3.8 : 2.8, wide ? 0.6 : 0.24,
    wide ? [lx - 0.32, 1.2, 0] : [-0.18, ly + size * 0.68 * 1.2, 0],
  );
  return { threads: [...lilac, ...pink], doilies: [] };
}
