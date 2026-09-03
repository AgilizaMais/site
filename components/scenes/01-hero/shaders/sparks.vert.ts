import { simplex3d } from '@/lib/gl/noise.glsl';

/**
 * Faíscas do contorno da fotografia.
 *
 * A câmera desta camada é ortográfica e as posições chegam normalizadas pela
 * altura da caixa da foto — então uma partícula fica colada no mesmo ponto do
 * ombro ou do cabelo em qualquer tamanho de tela, sem medição em runtime.
 */
export const sparksVert = /* glsl */ `
precision mediump float;

attribute vec4 aSeed;   // x: aleatório · y: tamanho · z: brilho · w: calor

uniform float uTime;
uniform float uReveal;   // 0 = nada · 1 = contorno inteiro aceso
uniform float uDrift;
uniform float uSize;
uniform float uPixelRatio;

varying float vBrightness;
varying float vWarmth;
varying float vTwinkle;

${simplex3d}

void main() {
  vec3 p = position;
  float phase = aSeed.x * 6.2831853;

  // Deriva lenta, na escala da foto. Sem ela o contorno lê como um adesivo.
  vec3 q = p * 7.0 + vec3(0.0, 0.0, uTime * 0.11);
  p.x += snoise(q) * uDrift;
  p.y += snoise(q + vec3(19.3, 7.1, 0.0)) * uDrift;

  /**
   * A revelação corre de baixo para cima, junto com a fotografia subindo: as
   * faíscas nascem do mesmo movimento, em vez de acenderem por cima dele.
   */
  float front = (0.5 - position.y) * 0.62 + aSeed.x * 0.38;
  float t = clamp((uReveal - front) / 0.38, 0.0, 1.0);

  vBrightness = aSeed.z * t;
  vWarmth = aSeed.w;
  vTwinkle = 0.55 + 0.45 * sin(uTime * 1.35 + phase);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);

  // Tamanho em pixels CSS, e só então multiplicado pelo DPR — limitar depois
  // encolhe a partícula em telas 2x/3x e o conjunto vira borrão.
  float cssSize = clamp(uSize * aSeed.y * (0.4 + 0.6 * t), 0.8, 2.2);
  gl_PointSize = cssSize * uPixelRatio;
}
`;
