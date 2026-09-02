import { simplex3d } from '@/lib/gl/noise.glsl';

/**
 * Toda a animação acontece aqui: nenhum buffer é atualizado na CPU.
 *
 * Três movimentos somados, em escalas de tempo diferentes — é a sobreposição
 * deles que faz a nuvem parecer viva em vez de uma malha rígida:
 *   1. deriva turbulenta contínua (cada partícula tem fase própria);
 *   2. respiração global, ciclo de 4s;
 *   3. uma onda lenta de luz atravessando a forma.
 */
export const particlesVert = /* glsl */ `
precision mediump float;

attribute vec3 aNormal;
attribute vec4 aSeed;   // x: semente · y: tamanho · z: campo de dobras · w: fase

uniform float uTime;
uniform float uFormation;   // 0 = pó disperso · 1 = forma completa
uniform float uBreath;      // amplitude da respiração
uniform float uDrift;       // amplitude da deriva turbulenta
uniform float uSize;
uniform float uPixelRatio;
uniform vec3  uKeyDir;
uniform vec3  uRimDir;

varying float vKey;
varying float vRim;
varying float vSeed;
varying float vDepth;
varying float vShell;
varying float vEdge;
varying float vCrown;
varying float vPulse;
varying float vTwinkle;

${simplex3d}

void main() {
  vec3 target = position;

  // --- 1. Deriva: campo de ruído que evolui no tempo. Cada partícula segue o
  // campo com fase própria, então a nuvem inteira nunca se move em bloco.
  float phase = aSeed.w * 6.2831853;
  vec3 q = target * 1.9 + vec3(0.0, 0.0, uTime * 0.09);
  vec3 flow = vec3(
    snoise(q + vec3(0.0, 0.0, 0.0)),
    snoise(q + vec3(19.3, 7.1, 0.0)),
    snoise(q + vec3(43.7, 31.9, 0.0))
  );
  // Componente tangencial: a partícula desliza sobre a superfície em vez de
  // furá-la — o volume se mantém legível enquanto tudo se move.
  vec3 tangential = flow - aNormal * dot(flow, aNormal);
  target += tangential * uDrift * (0.55 + 0.45 * sin(uTime * 0.5 + phase));
  target += aNormal * snoise(target * 2.6 + uTime * 0.16) * uDrift * 0.3;

  // --- 2. Respiração: ciclo de 4s.
  float breath = sin(uTime * 1.5707963) * 0.5 + 0.5;
  target *= 1.0 + breath * uBreath;

  // --- Estado disperso e formação escalonada.
  vec3 scattered = target + aNormal * (1.4 + aSeed.x * 2.6);
  scattered.y += (aSeed.y - 0.5) * 2.0;
  scattered += vec3(
    snoise(position * 0.6 + 11.0),
    snoise(position * 0.6 + 27.0),
    snoise(position * 0.6 + 53.0)
  ) * 1.1;

  float delay = aSeed.x * 0.45;
  float t = clamp((uFormation - delay) / (1.0 - delay), 0.0, 1.0);
  t = 1.0 - pow(1.0 - t, 4.0);

  vec3 p = mix(scattered, target, t);

  vec4 worldPosition = modelMatrix * vec4(p, 1.0);
  vec4 mvPosition = viewMatrix * worldPosition;
  gl_Position = projectionMatrix * mvPosition;

  vec3 viewDir = normalize(cameraPosition - worldPosition.xyz);
  vec3 worldNormal = normalize(mat3(modelMatrix) * aNormal);

  // Back-face cull suave. Com blending aditivo não há oclusão: sem isto, a
  // superfície de trás soma sobre a da frente e apaga o padrão de dobras.
  // A face voltada para a câmera é que desenha; a borda ganha um realce fino.
  float front = max(0.0, dot(worldNormal, viewDir));
  vEdge = pow(1.0 - front, 3.0);
  vShell = front * 0.95 + vEdge * 0.45;

  // A base dissolve: a forma emerge do escuro, não termina nele.
  vShell *= smoothstep(-1.28, -0.92, position.y);

  // Cristas acesas, sulcos apagados: o padrão de bandas que o olho reconhece
  // como cérebro. O valor vem da geração da nuvem, não é recalculado por frame.
  vCrown = smoothstep(0.18, 0.72, aSeed.z);

  // --- 3. Onda de luz percorrendo a forma, de trás para a frente.
  float wave = fract(uTime * 0.075 - position.z * 0.26 - position.y * 0.08);
  vPulse = smoothstep(0.0, 0.1, wave) * smoothstep(0.3, 0.12, wave);

  // Cintilação: cada partícula acende e apaga no seu próprio tempo. Com a
  // deriva mantida pequena para não borrar os sulcos, é a luz que carrega o
  // movimento — e ela não custa nada em legibilidade da forma.
  vTwinkle = 0.74 + 0.26 * sin(uTime * 1.15 + aSeed.w * 6.2831853);

  // Uma key light e um rim. Contraste alto: no escuro, meio-tom é ruído.
  vKey = pow(clamp(dot(worldNormal, uKeyDir), 0.0, 1.0), 0.75);
  vRim = smoothstep(0.15, 0.95, dot(worldNormal, uRimDir));
  vSeed = aSeed.x;
  vDepth = clamp((-mvPosition.z - 2.5) / 5.0, 0.0, 1.0);

  // O tamanho é fixado em PIXELS CSS e só então multiplicado pelo DPR. Fazer o
  // clamp depois do DPR (como antes) encolhia a partícula em telas 2x/3x: no
  // celular ela virava um ponto sub-pixel e o conjunto lia como borrão.
  float size = uSize * aSeed.y * mix(0.5, 1.0, t);
  float cssSize = clamp(size * (6.5 / -mvPosition.z), 1.0, 3.0);
  gl_PointSize = cssSize * uPixelRatio;
}
`;
