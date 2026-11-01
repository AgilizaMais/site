/**
 * Geometria da "alma" de cada fio: amostragem Catmull-Rom centrípeta através
 * dos pontos de controle + referenciais por transporte paralelo (sem torções
 * bruscas). Tudo em arrays tipados — roda a cada frame sem gerar lixo.
 */

const EPS = 1e-6;

/**
 * Amostra uma curva Catmull-Rom centrípeta (α = 0.5) que passa por `ctrl`
 * (K pontos xyz) e escreve S pontos em `out`. As amostras são distribuídas
 * proporcionalmente ao comprimento de cada segmento → espaçamento quase uniforme.
 */
export function sampleCurve(ctrl: Float32Array, K: number, out: Float32Array, S: number) {
  // comprimento das cordas para distribuir as amostras
  let total = 0;
  const seg = segScratch(K);
  for (let i = 0; i < K - 1; i++) {
    const dx = ctrl[(i + 1) * 3]! - ctrl[i * 3]!;
    const dy = ctrl[(i + 1) * 3 + 1]! - ctrl[i * 3 + 1]!;
    const dz = ctrl[(i + 1) * 3 + 2]! - ctrl[i * 3 + 2]!;
    const l = Math.sqrt(dx * dx + dy * dy + dz * dz) + EPS;
    seg[i] = l;
    total += l;
  }

  let written = 0;
  let acc = 0;
  for (let i = 0; i < K - 1; i++) {
    acc += seg[i]!;
    const last = i === K - 2;
    // índice da amostra que cai exatamente no fim deste segmento
    const target = last ? S : Math.round((acc / total) * (S - 1));
    const count = last ? S - written : Math.max(1, target - written);
    for (let j = 0; j < count && written < S; j++) {
      const t = last ? (count === 1 ? 1 : j / (count - 1)) : j / count;
      evalSegment(ctrl, K, i, t, out, written * 3);
      written++;
    }
  }
}

let _seg = new Float32Array(64);
function segScratch(K: number) {
  if (_seg.length < K) _seg = new Float32Array(K * 2);
  return _seg;
}

function pt(ctrl: Float32Array, K: number, i: number, o: number) {
  // pontos fantasmas nas pontas por extrapolação linear
  if (i < 0) return 2 * ctrl[o]! - ctrl[3 + o]!;
  if (i >= K) return 2 * ctrl[(K - 1) * 3 + o]! - ctrl[(K - 2) * 3 + o]!;
  return ctrl[i * 3 + o]!;
}

const P = new Float32Array(12);

function evalSegment(ctrl: Float32Array, K: number, i: number, t: number, out: Float32Array, o: number) {
  for (let k = 0; k < 4; k++) {
    P[k * 3] = pt(ctrl, K, i - 1 + k, 0);
    P[k * 3 + 1] = pt(ctrl, K, i - 1 + k, 1);
    P[k * 3 + 2] = pt(ctrl, K, i - 1 + k, 2);
  }
  const d01 = Math.pow(dist(0, 1) + EPS, 0.5);
  const d12 = Math.pow(dist(1, 2) + EPS, 0.5);
  const d23 = Math.pow(dist(2, 3) + EPS, 0.5);
  const t0 = 0;
  const t1 = t0 + d01;
  const t2 = t1 + d12;
  const t3 = t2 + d23;
  const tt = t1 + (t2 - t1) * t;
  for (let c = 0; c < 3; c++) {
    const p0 = P[c]!;
    const p1 = P[3 + c]!;
    const p2 = P[6 + c]!;
    const p3 = P[9 + c]!;
    const a1 = ((t1 - tt) / (t1 - t0)) * p0 + ((tt - t0) / (t1 - t0)) * p1;
    const a2 = ((t2 - tt) / (t2 - t1)) * p1 + ((tt - t1) / (t2 - t1)) * p2;
    const a3 = ((t3 - tt) / (t3 - t2)) * p2 + ((tt - t2) / (t3 - t2)) * p3;
    const b1 = ((t2 - tt) / (t2 - t0)) * a1 + ((tt - t0) / (t2 - t0)) * a2;
    const b2 = ((t3 - tt) / (t3 - t1)) * a2 + ((tt - t1) / (t3 - t1)) * a3;
    out[o + c] = ((t2 - tt) / (t2 - t1)) * b1 + ((tt - t1) / (t2 - t1)) * b2;
  }
}

function dist(a: number, b: number) {
  const dx = P[b * 3]! - P[a * 3]!;
  const dy = P[b * 3 + 1]! - P[a * 3 + 1]!;
  const dz = P[b * 3 + 2]! - P[a * 3 + 2]!;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Escreve na linha `row` do buffer da textura (largura S, 3 linhas por fio):
 *   linha 0 → posição xyz + comprimento de arco acumulado
 *   linha 1 → normal xyz + afinamento (taper)
 *   linha 2 → binormal xyz
 * Referencial por transporte paralelo, semeado pelo eixo Z (fios correm no plano XY).
 */
export function writeFrames(
  pts: Float32Array,
  S: number,
  tex: Float32Array,
  rowBase: number,
  taperEnds: number,
) {
  const W = S * 4;
  const o0 = rowBase * W;
  const o1 = (rowBase + 1) * W;
  const o2 = (rowBase + 2) * W;

  let px = 0, py = 0, pz = 0; // tangente anterior
  let nx = 0, ny = 0, nz = 0; // normal transportada
  let arc = 0;

  for (let i = 0; i < S; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(S - 1, i + 1);
    let tx = pts[b * 3]! - pts[a * 3]!;
    let ty = pts[b * 3 + 1]! - pts[a * 3 + 1]!;
    let tz = pts[b * 3 + 2]! - pts[a * 3 + 2]!;
    let tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
    if (tl < EPS) {
      tx = px || 1; ty = py; tz = pz; tl = 1;
    }
    tx /= tl; ty /= tl; tz /= tl;

    if (i === 0) {
      // N0 = normalize(cross(T, Z))
      nx = ty; ny = -tx; nz = 0;
      let nl = Math.sqrt(nx * nx + ny * ny);
      if (nl < 1e-4) { nx = 1; ny = 0; nl = 1; }
      nx /= nl; ny /= nl;
    } else {
      // rotaciona N pelo menor ângulo que leva T(i-1) em T(i)
      const bx = py * tz - pz * ty;
      const by = pz * tx - px * tz;
      const bz = px * ty - py * tx;
      const bl = Math.sqrt(bx * bx + by * by + bz * bz);
      if (bl > 1e-6) {
        const ux = bx / bl, uy = by / bl, uz = bz / bl;
        const cos = Math.min(1, Math.max(-1, px * tx + py * ty + pz * tz));
        const sin = bl;
        // Rodrigues
        const dot = ux * nx + uy * ny + uz * nz;
        const cx = uy * nz - uz * ny;
        const cy = uz * nx - ux * nz;
        const cz = ux * ny - uy * nx;
        nx = nx * cos + cx * sin + ux * dot * (1 - cos);
        ny = ny * cos + cy * sin + uy * dot * (1 - cos);
        nz = nz * cos + cz * sin + uz * dot * (1 - cos);
      }
      // re-ortogonaliza
      const d = nx * tx + ny * ty + nz * tz;
      nx -= tx * d; ny -= ty * d; nz -= tz * d;
      const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= nl; ny /= nl; nz /= nl;

      const sx = pts[i * 3]! - pts[(i - 1) * 3]!;
      const sy = pts[i * 3 + 1]! - pts[(i - 1) * 3 + 1]!;
      const sz = pts[i * 3 + 2]! - pts[(i - 1) * 3 + 2]!;
      arc += Math.sqrt(sx * sx + sy * sy + sz * sz);
    }

    // B = T × N
    const bx = ty * nz - tz * ny;
    const by = tz * nx - tx * nz;
    const bz = tx * ny - ty * nx;

    // afinamento suave nas pontas (fios que terminam dentro da tela)
    let taper = 1;
    if (taperEnds > 0) {
      const u = i / (S - 1);
      const e = Math.min(u, 1 - u) / taperEnds;
      taper = e >= 1 ? 1 : Math.sqrt(Math.max(0, e * (2 - e)));
    }

    const k = i * 4;
    tex[o0 + k] = pts[i * 3]!;
    tex[o0 + k + 1] = pts[i * 3 + 1]!;
    tex[o0 + k + 2] = pts[i * 3 + 2]!;
    tex[o0 + k + 3] = arc;
    tex[o1 + k] = nx;
    tex[o1 + k + 1] = ny;
    tex[o1 + k + 2] = nz;
    tex[o1 + k + 3] = taper;
    tex[o2 + k] = bx;
    tex[o2 + k + 1] = by;
    tex[o2 + k + 2] = bz;
    tex[o2 + k + 3] = 0;

    px = tx; py = ty; pz = tz;
  }
}
