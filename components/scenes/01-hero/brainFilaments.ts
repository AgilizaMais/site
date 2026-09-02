/**
 * Traçado de filamentos sobre a superfície do cérebro.
 *
 * A diferença essencial em relação a amostrar a superfície e filtrar por
 * densidade: aqui as curvas são *seguidas*. Para cada semente, caminhamos ao
 * longo da linha de nível do campo de fase — que é, por construção, a crista de
 * um giro — corrigindo a cada passo o desvio na superfície e na fase
 * (predictor–corrector). O resultado é um cordão contínuo de pontos, e não uma
 * poeira que por acaso se concentra nas cristas.
 *
 * Roda uma vez, num Web Worker.
 */

import {
  brainSDF,
  cerebellumPhase,
  cerebrumPhase,
  sdCerebellum,
  sdCerebrum,
  sdStem,
  stemPhase,
  sylvianDistance,
  type Vec3,
} from './brainGeometry';

type Field = (x: number, y: number, z: number) => number;

const TAU = Math.PI * 2;

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

/**
 * Gradiente por diferenças centrais, JÁ DIVIDIDO por 2e.
 *
 * Sem essa divisão o vetor sai com a magnitude multiplicada por 2e, e o passo
 * de Newton do corretor fica ~1/(2e) vezes maior que o correto — o traçado
 * diverge na primeira iteração. Para a normal isso é invisível (ela é
 * normalizada em seguida), mas para o corretor de fase é fatal.
 */
function gradient(f: Field, x: number, y: number, z: number, e: number, out: Vec3) {
  const inv = 1 / (2 * e);
  out[0] = (f(x + e, y, z) - f(x - e, y, z)) * inv;
  out[1] = (f(x, y + e, z) - f(x, y - e, z)) * inv;
  out[2] = (f(x, y, z + e) - f(x, y, z - e)) * inv;
}

function normalize(v: Vec3) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  v[0] /= l;
  v[1] /= l;
  v[2] /= l;
  return l;
}

/** Newton sobre o SDF: leva o ponto de volta à superfície. */
function projectToSurface(sdf: Field, p: Vec3, n: Vec3, iterations = 3) {
  for (let i = 0; i < iterations; i += 1) {
    const d = sdf(p[0], p[1], p[2]);
    gradient(sdf, p[0], p[1], p[2], 0.004, n);
    normalize(n);
    p[0] -= n[0] * d;
    p[1] -= n[1] * d;
    p[2] -= n[2] * d;
  }
}

export type Filament = {
  /** Índice do primeiro ponto no buffer. */
  start: number;
  count: number;
};

export type BrainCloud = {
  positions: Float32Array;
  normals: Float32Array;
  /** x: aleatório · y: tamanho · z: brilho do filamento · w: fase temporal */
  seeds: Float32Array;
  count: number;
};

type RegionOptions = {
  /** Forma sobre a qual os filamentos correm. */
  sdf: Field;
  /** Campo cuja linha de nível é seguida. */
  phase: Field;
  /** Espaçamento entre filamentos vizinhos, em radianos de fase. */
  phaseSpacing: number;
  /** Passo ao longo da curva. */
  step: number;
  maxSteps: number;
  seeds: number;
  /** Altura da crista: o filamento é deslocado para fora da forma lisa. */
  relief: number;
  /** Descarta pontos que caiam dentro de outra parte do órgão. */
  reject?: (x: number, y: number, z: number) => boolean;
  /** Brilho base do filamento. */
  brightness: number;
  /** Espessura da faixa de partículas em torno da curva. */
  jitter: number;
  /** Filamentos mais curtos que isto são descartados. */
  minPoints: number;
};

class Emitter {
  positions: number[] = [];
  normals: number[] = [];
  seeds: number[] = [];
  /**
   * Célula → identificador do filamento que passou por ela. Guardar a
   * identidade, e não uma contagem, é o que evita que um filamento se
   * detecte como sobreposição de si mesmo: com o passo menor que a célula,
   * dois pontos consecutivos caem na mesma célula.
   */
  private visited = new Map<number, number>();
  private pending = -1;
  private readonly cell: number;

  constructor(
    private rand: () => number,
    cell = 0.016,
  ) {
    this.cell = cell;
  }

  key(x: number, y: number, z: number) {
    const c = this.cell;
    return (
      (Math.round(x / c) + 512) * 1048576 +
      (Math.round(y / c) + 512) * 1024 +
      (Math.round(z / c) + 512)
    );
  }

  /** true se outro filamento já passou por aqui. */
  occupiedByOther(x: number, y: number, z: number, traceId: number) {
    const owner = this.visited.get(this.key(x, y, z));
    return owner !== undefined && owner !== traceId;
  }

  /** Marca o início de um filamento; os pontos ficam retidos até `endFilament`. */
  beginFilament() {
    this.pending = this.positions.length;
  }

  /** Confirma o filamento, ou o descarta se for curto demais. */
  endFilament(minPoints: number) {
    if (this.pending < 0) return;
    const added = (this.positions.length - this.pending) / 3;
    if (added < minPoints) {
      this.positions.length = this.pending;
      this.normals.length = this.pending;
      this.seeds.length = (this.pending / 3) * 4;
    }
    this.pending = -1;
  }

  push(p: Vec3, n: Vec3, brightness: number, jitter: number, phase: number, traceId: number) {
    const k = this.key(p[0], p[1], p[2]);
    if (!this.visited.has(k)) this.visited.set(k, traceId);

    // Deslocamento perpendicular pequeno: o cordão tem espessura, mas continua
    // lendo como linha.
    const jx = (this.rand() - 0.5) * jitter;
    const jy = (this.rand() - 0.5) * jitter;
    const jz = (this.rand() - 0.5) * jitter;

    this.positions.push(p[0] + jx, p[1] + jy, p[2] + jz);
    this.normals.push(n[0], n[1], n[2]);
    this.seeds.push(
      this.rand(),
      0.45 + this.rand() * 0.55,
      brightness * (0.72 + this.rand() * 0.28),
      phase,
    );
  }
}

function traceRegion(emitter: Emitter, rand: () => number, o: RegionOptions) {
  const p: Vec3 = [0, 0, 0];
  const n: Vec3 = [0, 0, 0];
  const g: Vec3 = [0, 0, 0];
  const t: Vec3 = [0, 0, 0];

  for (let s = 0; s < o.seeds; s += 1) {
    // Semente: direção aleatória a partir da origem da região, projetada na
    // superfície.
    const u = rand() * 2 - 1;
    const th = rand() * TAU;
    const r = Math.sqrt(1 - u * u);
    p[0] = r * Math.cos(th);
    p[1] = u;
    p[2] = r * Math.sin(th);
    p[0] *= 1.2;
    p[1] *= 1.2;
    p[2] *= 1.2;
    projectToSurface(o.sdf, p, n, 6);

    if (o.reject?.(p[0], p[1], p[2])) continue;

    // Trava a semente na crista mais próxima: o alvo é o múltiplo de
    // `phaseSpacing` mais perto da fase atual.
    const phi0 = o.phase(p[0], p[1], p[2]);
    const target = Math.round(phi0 / o.phaseSpacing) * o.phaseSpacing;

    let snapped = true;
    for (let corr = 0; corr < 6; corr += 1) {
      const phi = o.phase(p[0], p[1], p[2]);
      gradient(o.phase, p[0], p[1], p[2], 0.006, g);
      const g2 = g[0] * g[0] + g[1] * g[1] + g[2] * g[2];
      if (g2 < 1e-6) {
        snapped = false;
        break;
      }
      let drift = target - phi;
      drift -= o.phaseSpacing * Math.round(drift / o.phaseSpacing);
      // O limite é relativo ao espaçamento local entre filamentos
      // (spacing / |grad|), e não um valor absoluto: onde o campo varia
      // devagar, os filamentos ficam mais afastados e a busca precisa
      // alcançar mais longe.
      const gl0 = Math.sqrt(g2);
      const k = drift / g2;
      if (Math.abs(k) * gl0 > (0.6 * o.phaseSpacing) / gl0) {
        snapped = false;
        break;
      }
      p[0] += g[0] * k;
      p[1] += g[1] * k;
      p[2] += g[2] * k;
      projectToSurface(o.sdf, p, n, 3);
    }
    if (!snapped) continue;

    const traceId = s + 1;
    if (emitter.occupiedByOther(p[0], p[1], p[2], traceId)) continue;

    // O filamento é acumulado antes de ser emitido: curvas curtas viram
    // ilhas soltas, que sujam o desenho em vez de descrevê-lo.
    emitter.beginFilament();

    // Caminha nos dois sentidos a partir da semente.
    for (const dir of [1, -1]) {
      const q: Vec3 = [p[0], p[1], p[2]];
      let overlap = 0;

      for (let i = 0; i < o.maxSteps; i += 1) {
        projectToSurface(o.sdf, q, n, 2);

        // Se a curva se afastou da superfície ou saiu da região do órgão,
        // o traçado divergiu: encerra.
        if (Math.abs(o.sdf(q[0], q[1], q[2])) > o.step * 4) break;
        if (Math.abs(q[0]) > 1.6 || Math.abs(q[1]) > 1.8 || Math.abs(q[2]) > 1.8) break;

        gradient(o.phase, q[0], q[1], q[2], 0.006, g);

        // Componente do gradiente no plano tangente.
        const gn = g[0] * n[0] + g[1] * n[1] + g[2] * n[2];
        g[0] -= n[0] * gn;
        g[1] -= n[1] * gn;
        g[2] -= n[2] * gn;
        const gl = Math.hypot(g[0], g[1], g[2]);
        if (gl < 1e-6) break;

        // Direção da curva: perpendicular ao gradiente, sobre a superfície.
        t[0] = (n[1] * g[2] - n[2] * g[1]) / gl;
        t[1] = (n[2] * g[0] - n[0] * g[2]) / gl;
        t[2] = (n[0] * g[1] - n[1] * g[0]) / gl;
        normalize(t);

        q[0] += t[0] * o.step * dir;
        q[1] += t[1] * o.step * dir;
        q[2] += t[2] * o.step * dir;

        // Corretor: devolve o ponto à linha de nível.
        //
        // A fase salta de um período inteiro ao cruzar para o filamento
        // vizinho. Sem envolver o desvio nesse período, o corretor tenta
        // desfazer o salto e o traçado diverge — foi o que explodiu na
        // primeira versão.
        const phi = o.phase(q[0], q[1], q[2]);
        let drift = target - phi;
        drift -= o.phaseSpacing * Math.round(drift / o.phaseSpacing);

        const k = drift / Math.max(gl * gl, 1e-4);
        // A correção nunca pode ser maior que o próprio passo: se for, o ponto
        // está longe demais da linha de nível para ser recuperado.
        // Idem: a correção por passo não pode ultrapassar um terço do
        // espaçamento local, senão o ponto pulou para o filamento vizinho.
        const corrLen = Math.abs(k) * gl;
        if (corrLen > (0.34 * o.phaseSpacing) / gl) break;
        q[0] += g[0] * k;
        q[1] += g[1] * k;
        q[2] += g[2] * k;

        if (o.reject?.(q[0], q[1], q[2])) break;

        // Se a curva entra em território já desenhado, é a mesma linha vista de
        // outra semente: encerra em vez de sobrepor.
        if (emitter.occupiedByOther(q[0], q[1], q[2], traceId)) {
          overlap += 1;
          if (overlap > 8) break;
        } else {
          overlap = 0;
        }

        const out: Vec3 = [
          q[0] + n[0] * o.relief,
          q[1] + n[1] * o.relief,
          q[2] + n[2] * o.relief,
        ];
        emitter.push(out, n, o.brightness, o.jitter, i / o.maxSteps, traceId);
      }
    }

    emitter.endFilament(o.minPoints);
  }
}

/** Linha explícita: usada para os sulcos primários, que são marcos anatômicos. */
function traceExplicit(
  emitter: Emitter,
  sdf: Field,
  from: Vec3,
  to: Vec3,
  samples: number,
  brightness: number,
  jitter: number,
) {
  const p: Vec3 = [0, 0, 0];
  const n: Vec3 = [0, 0, 0];
  for (let i = 0; i <= samples; i += 1) {
    const u = i / samples;
    p[0] = from[0] + (to[0] - from[0]) * u;
    p[1] = from[1] + (to[1] - from[1]) * u;
    p[2] = from[2] + (to[2] - from[2]) * u;
    projectToSurface(sdf, p, n, 6);
    emitter.push(p, n, brightness, jitter, u, -1 - i);
  }
}

export type Quality = { cerebrumSeeds: number; step: number; maxSteps: number };

export function createBrainFilaments(q: Quality, seed = 20260902): BrainCloud {
  const rand = mulberry32(seed);
  const emitter = new Emitter(rand);

  const insideCerebellum = (x: number, y: number, z: number) => sdCerebellum(x, y, z) < 0.015;
  const insideStem = (x: number, y: number, z: number) => sdStem(x, y, z) < 0.01;

  // --- Giros do cérebro
  traceRegion(emitter, rand, {
    sdf: sdCerebrum,
    phase: cerebrumPhase,
    phaseSpacing: TAU,
    step: q.step,
    maxSteps: q.maxSteps,
    seeds: q.cerebrumSeeds,
    relief: 0.012,
    brightness: 1,
    jitter: 0.008,
    minPoints: 60,
    reject: (x, y, z) =>
      insideCerebellum(x, y, z) ||
      insideStem(x, y, z) ||
      // Deixa a fissura de Sylvius aberta: é ela que separa o lobo temporal.
      sylvianDistance(x, y, z) < 0.035,
  });

  // --- Folia do cerebelo: arcos finos e regulares, textura própria.
  traceRegion(emitter, rand, {
    sdf: sdCerebellum,
    phase: cerebellumPhase,
    phaseSpacing: TAU,
    step: q.step * 0.8,
    maxSteps: Math.round(q.maxSteps * 0.6),
    seeds: Math.round(q.cerebrumSeeds * 0.5),
    relief: 0.008,
    brightness: 0.92,
    jitter: 0.005,
    minPoints: 30,
    reject: (x, y, z) => insideStem(x, y, z),
  });

  // --- Tronco encefálico: linhas longitudinais.
  traceRegion(emitter, rand, {
    sdf: sdStem,
    phase: stemPhase,
    phaseSpacing: TAU,
    step: q.step,
    maxSteps: Math.round(q.maxSteps * 0.7),
    seeds: Math.round(q.cerebrumSeeds * 0.16),
    relief: 0.006,
    brightness: 0.85,
    jitter: 0.005,
    minPoints: 24,
  });

  // --- Sulcos primários, desenhados explicitamente: são os marcos que fazem a
  // leitura anatômica fechar, e não podem depender do acaso do ruído.
  for (const side of [1, -1]) {
    // Fissura de Sylvius
    traceExplicit(
      emitter,
      brainSDF,
      [side * 0.5, 0.02, 0.62],
      [side * 0.5, -0.24, -0.42],
      420,
      1.25,
      0.01,
    );
    // Sulco central
    traceExplicit(
      emitter,
      brainSDF,
      [side * 0.12, 0.68, 0.06],
      [side * 0.5, -0.06, -0.12],
      380,
      1.15,
      0.01,
    );
  }
  // Fissura longitudinal, vista de cima
  traceExplicit(emitter, brainSDF, [0, 0.7, 0.95], [0, 0.7, -0.95], 420, 1.1, 0.008);

  const count = emitter.positions.length / 3;
  return {
    positions: Float32Array.from(emitter.positions),
    normals: Float32Array.from(emitter.normals),
    seeds: Float32Array.from(emitter.seeds),
    count,
  };
}

const QUALITY_BY_TIER: Record<string, Quality> = {
  high: { cerebrumSeeds: 1500, step: 0.0075, maxSteps: 380 },
  mid: { cerebrumSeeds: 900, step: 0.009, maxSteps: 300 },
  low: { cerebrumSeeds: 420, step: 0.013, maxSteps: 220 },
  none: { cerebrumSeeds: 900, step: 0.009, maxSteps: 300 },
};

/** Área do objeto, em px CSS², na composição de referência (1440×900). */
const REFERENCE_AREA = 820 * 820;

/**
 * Qualidade final: o teto vem do tier (custo do dispositivo), e a densidade
 * acompanha a área que o objeto ocupa na tela. Contagem fixa era o que borrava
 * o mobile — os mesmos filamentos espremidos em ~16% da área saturavam o
 * blending aditivo.
 *
 * O valor é quantizado para não regerar a nuvem a cada pixel de resize.
 */
export function qualityFor(tier: string, objectAreaPx: number): Quality {
  const base = QUALITY_BY_TIER[tier] ?? QUALITY_BY_TIER.mid!;
  const ratio = Math.min(1, objectAreaPx / REFERENCE_AREA) ** 0.85;
  const seeds = Math.max(200, Math.round((base.cerebrumSeeds * ratio) / 50) * 50);
  return { ...base, cerebrumSeeds: seeds };
}
