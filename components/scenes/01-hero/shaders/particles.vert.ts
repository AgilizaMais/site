import { simplex3d } from '@/lib/gl/noise.glsl';

/**
 * Toda a animação das partículas acontece aqui: nenhum buffer é atualizado
 * na CPU. Posição = mistura entre dispersão inicial e alvo, mais respiração
 * e um deslocamento de ruído de baixa amplitude.
 */
export const particlesVert = /* glsl */ `
precision mediump float;

attribute vec3 aNormal;
attribute vec2 aSeed;

uniform float uTime;
uniform float uFormation;   // 0 = pó disperso · 1 = busto formado
uniform float uBreath;      // amplitude da respiração
uniform float uSize;
uniform float uPixelRatio;
uniform vec3  uKeyDir;
uniform vec3  uRimDir;

varying float vKey;
varying float vRim;
varying float vSeed;
varying float vDepth;
varying float vShell;

${simplex3d}

void main() {
  vec3 target = position;

  // --- Respiração: escala global mínima (1,5%), ciclo de 4s.
  float breath = sin(uTime * 1.5707963) * 0.5 + 0.5; // 4s por ciclo
  target *= 1.0 + breath * uBreath;

  // --- Deslocamento orgânico: a superfície nunca fica estática.
  float n = snoise(target * 1.35 + vec3(0.0, 0.0, uTime * 0.12));
  target += aNormal * n * 0.022;

  // --- Estado disperso: pó longe do centro, na direção da própria normal.
  vec3 scattered = target + aNormal * (1.6 + aSeed.x * 2.4);
  scattered.y += (aSeed.y - 0.5) * 1.8;
  scattered += vec3(
    snoise(target * 0.6 + 11.0),
    snoise(target * 0.6 + 27.0),
    snoise(target * 0.6 + 53.0)
  ) * 0.9;

  // Formação escalonada: cada partícula chega no seu tempo.
  float delay = aSeed.x * 0.45;
  float t = clamp((uFormation - delay) / (1.0 - delay), 0.0, 1.0);
  t = 1.0 - pow(1.0 - t, 4.0); // easeOutQuart no shader

  vec3 p = mix(scattered, target, t);

  vec4 worldPosition = modelMatrix * vec4(p, 1.0);
  vec4 mvPosition = viewMatrix * worldPosition;
  gl_Position = projectionMatrix * mvPosition;

  // Casca luminosa: partículas de frente quase desaparecem, as de raspão
  // acendem. É isso que impede o busto de virar uma silhueta cheia — a luz
  // desenha o contorno, não o preenchimento.
  vec3 viewDir = normalize(cameraPosition - worldPosition.xyz);
  vec3 worldNormal = normalize(mat3(modelMatrix) * aNormal);
  float facing = abs(dot(worldNormal, viewDir));
  vShell = pow(1.0 - facing, 1.6);

  // A base dissolve: a forma emerge do escuro, não termina nele.
  vShell *= smoothstep(-0.78, -0.10, position.y);

  // Uma key light quente e um rim de acento — a luz é que desenha a forma.
  // Uma key light e um rim. O contraste é alto de propósito: no escuro,
  // meio-tom é ruído.
  vKey = pow(clamp(dot(worldNormal, uKeyDir), 0.0, 1.0), 0.75);
  vRim = smoothstep(0.15, 0.95, dot(worldNormal, uRimDir));
  vSeed = aSeed.x;
  vDepth = clamp((-mvPosition.z - 2.0) / 4.0, 0.0, 1.0);

  float size = uSize * aSeed.y * mix(0.5, 1.0, t);
  gl_PointSize = clamp(size * uPixelRatio * (6.5 / -mvPosition.z), 0.6, 4.0);
}
`;
