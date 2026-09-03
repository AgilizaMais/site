import { simplex3d } from '@/lib/gl/noise.glsl';

/**
 * Toda a animação acontece aqui: nenhum buffer é atualizado na CPU.
 *
 * Três movimentos somados, em escalas de tempo diferentes — é a sobreposição
 * deles que faz a nuvem parecer viva em vez de uma imagem parada:
 *   1. deriva turbulenta contínua (cada partícula com fase própria);
 *   2. respiração global, ciclo de 4s;
 *   3. cintilação lenta, também com fase por partícula.
 */
export const particlesVert = /* glsl */ `
precision mediump float;

attribute vec4 aSeed;   // x: aleatório · y: tamanho · z: brilho · w: calor

uniform float uTime;
uniform float uFormation;   // 0 = pó disperso · 1 = desenho formado
uniform float uBreath;
uniform float uDrift;
uniform float uZoom;
uniform float uSize;
uniform float uPixelRatio;

varying float vBrightness;
varying float vWarmth;
varying float vTwinkle;
varying float vDepth;
varying float vPulse;

${simplex3d}

void main() {
  vec3 target = position;

  // --- 1. Deriva: campo de ruído que evolui no tempo, com fase por partícula.
  //
  // Duas escalas somadas. A larga move regiões inteiras devagar — é ela que
  // faz a nuvem parecer respirar em vez de vibrar; a fina dá vida ponto a
  // ponto. Só a fina, o olho lê como ruído parado.
  float phase = aSeed.x * 6.2831853;

  vec3 qWide = target * 0.9 + vec3(0.0, 0.0, uTime * 0.16);
  vec3 wide = vec3(
    snoise(qWide),
    snoise(qWide + vec3(19.3, 7.1, 0.0)),
    snoise(qWide + vec3(43.7, 31.9, 0.0))
  );

  vec3 qFine = target * 3.4 + vec3(0.0, 0.0, uTime * 0.42);
  vec3 fine = vec3(
    snoise(qFine),
    snoise(qFine + vec3(5.1, 71.3, 0.0)),
    snoise(qFine + vec3(31.7, 12.9, 0.0))
  );

  target += wide * uDrift * (0.7 + 0.3 * sin(uTime * 0.42 + phase));
  target += fine * uDrift * 0.42 * (0.6 + 0.4 * sin(uTime * 1.1 + phase * 1.7));

  // --- 2. Respiração: ciclo de 4s.
  float breath = sin(uTime * 1.5707963) * 0.5 + 0.5;
  target *= 1.0 + breath * uBreath;

  // --- Estado disperso e formação escalonada: cada partícula chega no seu tempo.
  vec3 scattered = target * 1.35 + vec3(
    snoise(position * 0.8 + 11.0),
    snoise(position * 0.8 + 27.0),
    snoise(position * 0.8 + 53.0)
  ) * 0.85;
  scattered.z += (aSeed.x - 0.5) * 1.6;

  float delay = aSeed.x * 0.45;
  float t = clamp((uFormation - delay) / (1.0 - delay), 0.0, 1.0);
  t = 1.0 - pow(1.0 - t, 4.0);

  vec3 p = mix(scattered, target, t);

  // Aproximação de entrada. Fica aqui, e não num transform de CSS: o R3F mede
  // o contêiner com getBoundingClientRect, e um transform no pai fazia o
  // canvas nascer maior que a caixa que ele deveria preencher.
  p *= uZoom;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  vBrightness = aSeed.z;
  vWarmth = aSeed.w;
  vTwinkle = 0.68 + 0.32 * sin(uTime * 1.15 + phase);

  // Onda de luz atravessando a forma, da frente para trás. É o movimento que
  // se enxerga de longe, sem depender de olhar partícula por partícula.
  float wave = fract(uTime * 0.085 - position.x * 0.22 - position.y * 0.05);
  vPulse = smoothstep(0.0, 0.14, wave) * smoothstep(0.42, 0.16, wave);
  vDepth = clamp((-mvPosition.z - 3.4) / 2.0, 0.0, 1.0);

  // O tamanho é fixado em PIXELS CSS e só então multiplicado pelo DPR: limitar
  // depois do DPR encolhe a partícula em telas 2x/3x e o conjunto vira borrão.
  float size = uSize * aSeed.y * mix(0.5, 1.0, t);
  float cssSize = clamp(size * (4.4 / -mvPosition.z), 0.9, 2.6);
  gl_PointSize = cssSize * uPixelRatio;
}
`;
