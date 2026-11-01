/**
 * Shaders do fio. Três "materiais" de crochê, todos com a mesma luz:
 *  - ply   → linha torcida (3–4 cabos em hélice, fibras, sulcos, brilho anisotrópico)
 *  - cord  → cordão de tricô/crochê (colunas de pontos em "V", cada perna com torção)
 *  - doily → toalhinha/mandala de crochê (anéis, varetas, arcos e leques)
 * Cores chegam em espaço linear; a saída é convertida para sRGB aqui.
 */

const common = /* glsl */ `
  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  vec3 toSRGB(vec3 c) {
    c = max(c, 0.0);
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
  }
  // tonemapping suave para os brilhos não estourarem
  vec3 softTone(vec3 c) {
    return c / (1.0 + max(max(c.r, c.g), c.b) * 0.18);
  }
`;

const lighting = /* glsl */ `
  uniform vec3 uKeyDir;
  uniform vec3 uKeyCol;
  uniform vec3 uFillDir;
  uniform vec3 uFillCol;
  uniform vec3 uAmbient;
  uniform vec3 uRimCol;

  // Iluminação de fibra: difusa "wrap" + Kajiya-Kay (brilho anisotrópico ao longo da fibra)
  vec3 shadeFiber(vec3 albedo, vec3 n, vec3 fiberT, vec3 V, float ao, float sheen, float rimMask) {
    vec3 L1 = normalize(uKeyDir);
    vec3 L2 = normalize(uFillDir);
    float d1 = clamp((dot(n, L1) + 0.42) / 1.42, 0.0, 1.0);
    float d2 = clamp((dot(n, L2) + 0.3) / 1.3, 0.0, 1.0);
    vec3 diff = uAmbient + uKeyCol * d1 * d1 + uFillCol * d2;

    vec3 H1 = normalize(L1 + V);
    float th = dot(fiberT, H1);
    float kk = pow(sqrt(max(0.0, 1.0 - th * th)), 42.0);
    // segundo lóbulo, deslocado e tingido pela própria cor (fio de algodão/seda)
    vec3 H1s = normalize(L1 + V + n * 0.25);
    float th2 = dot(fiberT, H1s);
    float kk2 = pow(sqrt(max(0.0, 1.0 - th2 * th2)), 14.0);
    vec3 spec = uKeyCol * (kk * 0.32 + kk2 * 0.12 * albedo * 2.0) * sheen * d1;

    float fres = pow(1.0 - clamp(abs(dot(n, V)), 0.0, 1.0), 2.4);
    vec3 rim = uRimCol * fres * rimMask;

    return albedo * diff * ao + spec * ao + rim * mix(vec3(1.0), albedo * 2.2, 0.55);
  }
`;

/* ------------------------------------------------------------------ */
/* FIO (instanciado: um draw call para todos os fios)                  */
/* ------------------------------------------------------------------ */

export const yarnVertex = /* glsl */ `
  uniform sampler2D uSpine;
  uniform float uSamples;
  uniform float uTime;
  uniform float uDraw;

  attribute float iRow;
  attribute float iDelay;
  attribute float iRadius;
  attribute vec3 iColA;
  attribute vec3 iColB;
  attribute vec4 iParams; // x: cabos/colunas, y: ângulo de torção, z: tipo (0 fio, 1 cordão), w: semente
  attribute float iFlow;

  varying vec3 vPos;
  varying vec3 vRad;
  varying vec3 vTan;
  varying vec3 vCirc;
  varying float vS;
  varying float vTheta;
  varying float vRadius;
  varying vec3 vColA;
  varying vec3 vColB;
  varying vec4 vParams;

  vec4 fetchLerp(int row, float s) {
    float fi = clamp(s, 0.0, uSamples - 1.0);
    int i0 = int(floor(fi));
    int i1 = min(i0 + 1, int(uSamples) - 1);
    float f = fi - float(i0);
    return mix(texelFetch(uSpine, ivec2(i0, row), 0), texelFetch(uSpine, ivec2(i1, row), 0), f);
  }

  void main() {
    float along = position.x * (uSamples - 1.0);
    float theta = position.y;
    int base = int(iRow) * 3;

    vec4 P = fetchLerp(base, along);
    vec4 N = fetchLerp(base + 1, along);
    vec4 B = fetchLerp(base + 2, along);

    vec3 n = normalize(N.xyz);
    vec3 b = normalize(B.xyz);
    vec3 t = normalize(cross(n, b));

    float ang = theta * 6.2831853;
    vec3 radial = cos(ang) * n + sin(ang) * b;
    vec3 circ = -sin(ang) * n + cos(ang) * b;

    float r = iRadius * N.w;
    float s = P.w + uTime * iFlow;

    // relevo geométrico dos cabos → silhueta torcida de verdade
    float bump = 0.0;
    if (iParams.z < 0.5) {
      float circLen = 6.2831853 * iRadius;
      float u = (theta * circLen + s * tan(iParams.y)) * iParams.x / circLen;
      float x = fract(u) * 2.0 - 1.0;
      bump = sqrt(max(0.0, 1.0 - x * x)) - 0.62;
      r *= 1.0 + bump * 0.16;
    } else {
      float cols = iParams.x;
      float rowLen = 6.2831853 * iRadius / cols * 0.92;
      vec2 cell = fract(vec2(theta * cols, s / rowLen)) - 0.5;
      r *= 1.0 + (0.06 - abs(cell.x) * 0.16);
    }

    // entrada: o fio "é puxado" da esquerda para a direita
    float rv = clamp((uDraw - iDelay * 0.5) / 0.72, 0.0, 1.0);
    rv = (1.0 - pow(1.0 - rv, 3.0)) * 1.06;
    r *= smoothstep(rv, rv - 0.035, position.x);

    vec3 pos = P.xyz + radial * r;

    vPos = pos;
    vRad = radial;
    vTan = t;
    vCirc = circ;
    vS = s;
    vTheta = theta;
    vRadius = iRadius;
    vColA = iColA;
    vColB = iColB;
    vParams = iParams;

    gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);
  }
`;

export const yarnFragment = /* glsl */ `
  precision highp float;
  ${common}
  ${lighting}

  varying vec3 vPos;
  varying vec3 vRad;
  varying vec3 vTan;
  varying vec3 vCirc;
  varying float vS;
  varying float vTheta;
  varying float vRadius;
  varying vec3 vColA;
  varying vec3 vColB;
  varying vec4 vParams;

  uniform float uOpacity;

  // distância a um segmento + parâmetro ao longo dele
  vec2 segDist(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return vec2(length(pa - ba * h), h);
  }

  void main() {
    vec3 N0 = normalize(vRad);
    vec3 T = normalize(vTan);
    vec3 C = normalize(vCirc);
    vec3 V = normalize(cameraPosition - vPos);
    float seed = vParams.w;
    float circLen = 6.2831853 * vRadius;

    vec3 albedo;
    vec3 n;
    vec3 fiberT;
    float ao;

    if (vParams.z < 0.5) {
      /* ---------- LINHA TORCIDA ---------- */
      float plies = vParams.x;
      float ta = tan(vParams.y);
      float thetaLen = vTheta * circLen;
      float u = (thetaLen + vS * ta) * plies / circLen;
      float plyId = floor(u);
      float f = fract(u);
      float x = f * 2.0 - 1.0;
      float h = sqrt(max(0.0, 1.0 - x * x));

      vec3 A = normalize(C + T * ta);        // atravessa os cabos
      vec3 Pd = normalize(T - C * ta);       // direção do cabo
      n = normalize(N0 * (h + 0.08) + A * x * 0.9);

      // fibras: torção contrária dentro de cada cabo
      float plyW = circLen / plies;
      float y = (vS - thetaLen * ta) * inversesqrt(1.0 + ta * ta);
      float fc = x * 1.1 - y / plyW * 1.35;
      float fib = vnoise(vec2(fc * 7.0 + plyId * 13.7 + seed * 31.0, y / plyW * 0.55));
      float fib2 = vnoise(vec2(fc * 19.0 + plyId * 3.1, y / plyW * 1.7 + seed));
      float fibers = fib * 0.65 + fib2 * 0.35;

      float tone = 0.5 + 0.5 * sin(plyId * 2.39996 + seed * 6.0);
      albedo = mix(vColA, vColB, tone * 0.55);
      albedo *= 0.8 + 0.34 * fibers;
      // leve variação de lote ao longo do fio
      albedo *= 0.94 + 0.12 * vnoise(vec2(vS * 0.35, seed * 7.0));

      ao = mix(0.32, 1.0, smoothstep(0.0, 0.7, h));
      fiberT = normalize(Pd + A * (fibers - 0.5) * 0.9 - Pd * 0.0);
      // perturbação fina na normal pelas fibras
      n = normalize(n + A * (fib2 - 0.5) * 0.35);
    } else {
      /* ---------- CORDÃO DE PONTOS (tricotin / correntinha) ---------- */
      float cols = vParams.x;
      float rowLen = circLen / cols * 0.92;
      vec2 g = vec2(vTheta * cols, vS / rowLen);
      vec2 id = floor(g);
      vec2 lp = fract(g) - 0.5;

      float best = 0.0;
      vec2 grad = vec2(0.0);
      float legT = 0.0;
      float legSide = 0.0;
      float legId = 0.0;
      // avalia a carreira atual e as vizinhas (as pernas do "V" se sobrepõem)
      for (int k = -1; k <= 1; k++) {
        vec2 q = lp - vec2(0.0, float(k));
        for (int side = 0; side < 2; side++) {
          float sx = side == 0 ? -1.0 : 1.0;
          vec2 a = vec2(0.47 * sx, 0.78);
          vec2 b = vec2(0.0, -0.38);
          vec2 d = segDist(q, a, b);
          float w = 0.27 * (0.82 + 0.18 * sin(d.y * 3.14159));
          float hh = 1.0 - (d.x * d.x) / (w * w);
          hh = hh > 0.0 ? sqrt(hh) : 0.0;
          hh *= 1.0 - float(k) * 0.04;
          if (hh > best) {
            best = hh;
            vec2 ab = b - a;
            vec2 cp = a + ab * d.y;
            grad = (q - cp) / max(w, 1e-3);
            legT = d.y;
            legSide = sx;
            legId = id.y + float(k) + sx * 0.37 + id.x * 1.91;
          }
        }
      }
      float h = best;
      // torção do fio dentro de cada perna
      vec2 legDir = normalize(vec2(-0.47 * legSide, -1.16));
      float across = dot(grad, vec2(-legDir.y, legDir.x));
      float tw = fract(legT * 5.5 + across * 0.9 + legId * 0.31);
      float twBump = sin(tw * 3.14159);

      n = normalize(N0 * (h + 0.05) + (C * grad.x + T * grad.y) * 0.95);
      n = normalize(n + (C * legDir.y - T * legDir.x) * (twBump - 0.5) * 0.25);

      float fibers = vnoise(vec2(across * 9.0 + legId * 7.0, legT * 14.0));
      albedo = mix(vColA, vColB, 0.5 + 0.5 * sin(legId * 1.7 + seed));
      albedo = mix(vColA, albedo, 0.35);
      albedo *= 0.8 + 0.3 * fibers;
      albedo *= 0.82 + 0.22 * twBump;
      ao = mix(0.18, 1.0, smoothstep(0.0, 0.55, h));
      fiberT = normalize(C * legDir.x + T * legDir.y);
    }

    vec3 col = shadeFiber(albedo, n, fiberT, V, ao, 1.0, 0.9);
    col = softTone(col);
    gl_FragColor = vec4(toSRGB(col) * uOpacity, uOpacity);
  }
`;

/* ------------------------------------------------------------------ */
/* TOALHINHA DE CROCHÊ (mandala procedural)                            */
/* ------------------------------------------------------------------ */

export const doilyVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPos;
  void main() {
    vUv = uv * 2.0 - 1.0;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const doilyFragment = /* glsl */ `
  precision highp float;
  ${common}
  ${lighting}

  varying vec2 vUv;
  varying vec3 vPos;
  uniform vec3 uColA;
  uniform vec3 uColB;
  uniform float uOpacity;
  uniform float uSpin;

  #define TAU 6.2831853

  // perfil arredondado de um fio com meia-largura w
  float tube(float d, float w) {
    float x = d / w;
    return x < 1.0 ? sqrt(1.0 - x * x) : 0.0;
  }

  // vareta (ponto alto) com as duas "laçadas" visíveis
  float post(float lat, float rr, float r0, float r1, float w) {
    if (rr < r0 || rr > r1) return 0.0;
    float t = (rr - r0) / (r1 - r0);
    float wraps = 0.78 + 0.22 * abs(sin(t * 3.14159 * 2.0 + 0.4));
    float ends = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.9, t);
    return tube(abs(lat), w * (0.85 + 0.15 * wraps)) * wraps * mix(0.6, 1.0, ends);
  }

  // altura do relevo + id do elemento (para variação de tom)
  vec2 field(vec2 p) {
    float r = length(p);
    float a = atan(p.y, p.x) + uSpin;
    float h = 0.0;
    float id = 0.0;
    float v;

    // anel mágico + 12 varetas curtas
    v = tube(abs(r - 0.05), 0.018);
    if (v > h) { h = v; id = 1.0; }
    {
      float n = 12.0;
      float c = fract(a * n / TAU + 0.5) - 0.5;
      v = post(c * TAU / n * r, r, 0.06, 0.15, 0.016);
      if (v > h) { h = v; id = 2.0; }
    }
    v = tube(abs(r - 0.155), 0.012) * (0.8 + 0.2 * sin(a * 36.0));
    if (v > h) { h = v; id = 3.0; }

    // carreira de 24 varetas
    {
      float n = 24.0;
      float c = fract(a * n / TAU + 0.5) - 0.5;
      v = post(c * TAU / n * r, r, 0.165, 0.275, 0.0125);
      if (v > h) { h = v; id = 4.0; }
    }
    // correntinha
    v = tube(abs(r - 0.285), 0.011) * (0.75 + 0.25 * abs(sin(a * 60.0)));
    if (v > h) { h = v; id = 5.0; }

    // rede em losangos (correntinhas cruzadas)
    if (r > 0.29 && r < 0.5) {
      float n = 24.0;
      float u = a * n / TAU;
      float vv = (r - 0.29) / 0.21 * 3.0;
      float cell = TAU * r / n;
      float d1 = abs(fract(u + vv + 0.5) - 0.5);
      float d2 = abs(fract(u - vv + 0.5) - 0.5);
      float d = min(d1, d2) * cell * 0.72;
      float bead = 0.78 + 0.22 * abs(sin((u * 2.0 + vv) * 9.0));
      v = tube(d, 0.0085) * bead;
      if (v > h) { h = v; id = 6.0; }
    }

    // faixa de pontos baixos (bem fechadinha)
    {
      float n = 96.0;
      float c = fract(a * n / TAU + 0.5) - 0.5;
      v = post(c * TAU / n * r, r, 0.5, 0.56, 0.0075) * 0.9;
      if (v > h) { h = v; id = 7.0; }
      v = tube(abs(r - 0.5), 0.008);
      if (v > h) { h = v; id = 7.0; }
      v = tube(abs(r - 0.565), 0.009) * (0.8 + 0.2 * sin(a * 96.0));
      if (v > h) { h = v; id = 7.5; }
    }

    // leques (pontos em concha)
    if (r > 0.565 && r < 0.88) {
      float n = 12.0;
      float c = fract(a * n / TAU) - 0.5;
      float cw = TAU / n;
      vec2 q = vec2(c * cw * 0.575, r - 0.57);
      float rr = length(q);
      float ang = atan(q.x, q.y);
      float k = clamp(floor(ang / 0.22 + 0.5), -3.0, 3.0);
      float diff = ang - k * 0.22;
      float lat = sin(diff) * rr;
      float ok = step(abs(ang), 0.78);
      v = post(lat, rr, 0.02, 0.25, 0.0085) * ok;
      if (v > h) { h = v; id = 8.0 + mod(k, 2.0); }
      // borda do leque
      v = tube(abs(rr - 0.262), 0.0105) * step(abs(ang), 0.82) * (0.8 + 0.2 * sin(ang * 30.0));
      if (v > h) { h = v; id = 10.0; }
      // correntinha entre leques
      float between = abs(abs(c) - 0.5) * cw * r;
      v = tube(abs(r - 0.72), 0.008) * step(0.82, abs(ang)) * step(between, 0.12);
      if (v > h) { h = v; id = 11.0; }
    }

    // piquinhos
    if (r > 0.82 && r < 0.95) {
      float n = 12.0 * 5.0;
      float c = fract(a * n / TAU) - 0.5;
      float cell = TAU / n * r;
      float rad = 0.022;
      vec2 q = vec2(c * cell, r - 0.84 - 0.01 * cos(fract(a * 12.0 / TAU) * TAU));
      v = tube(abs(length(q - vec2(0.0, rad)) - rad), 0.0075);
      if (v > h) { h = v; id = 12.0; }
    }
    return vec2(h, id);
  }

  void main() {
    vec2 p = vUv;
    float r = length(p);
    if (r > 1.0) discard;

    float e = 0.0022;
    vec2 f0 = field(p);
    float h = f0.x;
    if (h <= 0.001) discard;
    float hx = field(p + vec2(e, 0.0)).x;
    float hy = field(p + vec2(0.0, e)).x;
    vec3 n = normalize(vec3(-(hx - h) / e * 0.008, -(hy - h) / e * 0.008, 1.0));
    n = normalize(mix(vec3(0.0, 0.0, 1.0), n, 0.9));

    // fibras + torção
    float a = atan(p.y, p.x);
    float tw = vnoise(vec2(a * 60.0, r * 140.0)) * 0.6 + vnoise(vec2(a * 160.0, r * 30.0)) * 0.4;
    vec3 albedo = mix(uColA, uColB, 0.5 + 0.5 * sin(f0.y * 1.9));
    albedo *= 0.78 + 0.36 * tw;
    float ao = mix(0.35, 1.0, smoothstep(0.0, 0.8, h));

    vec3 V = normalize(cameraPosition - vPos);
    vec3 fiberT = normalize(vec3(-p.y, p.x, 0.0) * mix(1.0, -1.0, step(0.5, fract(f0.y * 0.5))) + vec3(p, 0.0) * 0.6);
    vec3 col = shadeFiber(albedo, n, fiberT, V, ao, 0.7, 0.5);
    col = softTone(col);
    float alpha = smoothstep(0.0, 0.18, h) * uOpacity;
    gl_FragColor = vec4(toSRGB(col) * alpha, alpha);
  }
`;

/* ------------------------------------------------------------------ */
/* FOTO DA MODELO (plano com franjas "vivas")                          */
/* ------------------------------------------------------------------ */

export const photoVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

export const photoFragment = /* glsl */ `
  precision highp float;
  ${common}
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uSway;
  uniform float uFade;
  uniform float uAlpha;
  uniform vec4 uFringe; // x0, x1, y0 (topo das franjas), y1 (base) em uv

  void main() {
    vec2 uv = vUv;
    // franjas balançam com a brisa: deslocamento cresce para baixo
    float fy = smoothstep(uFringe.z, uFringe.w, 1.0 - uv.y);
    float inX = smoothstep(uFringe.x - 0.03, uFringe.x + 0.03, uv.x) * (1.0 - smoothstep(uFringe.y - 0.03, uFringe.y + 0.03, uv.x));
    float k = fy * fy * inX * uSway;
    float wave = sin(uTime * 1.6 + uv.y * 9.0 + uv.x * 3.0) * 0.6 + sin(uTime * 2.7 + uv.x * 21.0) * 0.4;
    uv.x += wave * 0.006 * k;

    vec4 c = texture2D(uMap, uv);
    // a pele não deve ondular: se o pixel deslocado for pele, usa o original
    vec4 c0 = texture2D(uMap, vUv);
    float skin = smoothstep(0.06, 0.16, c0.r - c0.b) * (1.0 - smoothstep(0.42, 0.58, c0.b / max(c0.r, 0.001)));
    c = mix(c, c0, skin * 0.85);

    // dissolve suave na base
    float fade = 1.0 - smoothstep(1.0 - uFade, 1.0, 1.0 - uv.y);
    float a = c.a * fade * uAlpha;
    gl_FragColor = vec4(toSRGB(c.rgb) * a, a);
  }
`;

/* ------------------------------------------------------------------ */
/* TOALHINHA PRÉ-RENDERIZADA (textura) — só gira, custo quase zero     */
/* ------------------------------------------------------------------ */

export const bakedVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

export const bakedFragment = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform float uOpacity;
  void main() {
    // a textura já guarda cor sRGB pré-multiplicada pelo alfa
    gl_FragColor = texture2D(uMap, vUv) * uOpacity;
  }
`;
