import { simplex3d } from '@/lib/gl/noise.glsl';

/**
 * CENA 4 — FLEXIBILIDADE PSICOLÓGICA
 *
 * Uma fita contínua. A malha é um plano; toda a forma vem daqui.
 *
 * A construção é a de um tubo achatado: para cada ponto ao longo do
 * comprimento existe um eixo (a tangente da curva-guia) e uma seção
 * transversal que gira em torno dele. Torcer é girar a seção; dobrar é curvar
 * a guia. Como a superfície é sempre gerada a partir de uma curva contínua,
 * ela não tem como se partir — que é exatamente o que a cena afirma.
 */
export const ribbonVert = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uProgress;
uniform float uPointer;
uniform float uWidth;
uniform float uLength;
uniform float uAmp;

varying vec3 vNormal;
varying vec3 vView;
varying float vTwist;
varying float vAcross;

${simplex3d}

/** Curva-guia: por onde a fita corre. */
vec3 guide(float t) {
  float x = t * uLength;

  // Ondulação de base, sempre presente — a fita nunca é uma régua.
  float y = sin(x * 0.55 + uTime * 0.07) * 0.30 * uAmp;
  float z = cos(x * 0.41 - uTime * 0.05) * 0.34 * uAmp;

  // A dobra cresce no meio do percurso e é absorvida no fim: o movimento
  // atravessa a fita e se dissipa, sem oscilação residual.
  float bend = smoothstep(0.12, 0.52, uProgress) * (1.0 - smoothstep(0.62, 0.94, uProgress) * 0.62);
  y += snoise(vec3(x * 0.42, uTime * 0.06, 0.0)) * 0.55 * bend * uAmp;
  z += snoise(vec3(x * 0.35, uTime * 0.05, 7.3)) * 0.52 * bend * uAmp;

  return vec3(x, y, z);
}

/**
 * Ângulo da seção transversal em torno do eixo. Torcer é girar isto.
 *
 * O ângulo depende de t (a posição normalizada), e não da coordenada de
 * mundo: assim o número de voltas da fita é o mesmo em qualquer viewport —
 * numa tela larga a fita fica mais longa, não mais retorcida.
 */
float twistAngle(float t) {
  // Uma torção de repouso, sempre presente. Sem ela a fita entra na cena como
  // uma placa chapada de frente para a câmera — larga, clara e sem forma.
  float rest = t * 2.4 + sin(t * 3.1 + uTime * 0.18) * 0.55;

  // A torção do percurso entra depois da dobra e permanece: o que se resolve
  // é a agitação, não a forma que a fita assumiu.
  float amount = smoothstep(0.18, 0.66, uProgress);
  float settle = 1.0 - smoothstep(0.60, 0.92, uProgress) * 0.35;

  float driven = t * 5.4 + sin(t * 4.4 + uTime * 0.22) * 1.5;
  return rest + driven * amount * settle;
}

/** Um ponto da superfície: guia + seção transversal girada. */
vec3 surfacePoint(float t, float across) {
  vec3 c = guide(t);

  // Tangente por diferença: a guia é analítica, mas derivar à mão custaria
  // mais linhas do que vale.
  float e = 0.004;
  vec3 tangent = normalize(guide(t + e) - guide(t - e));

  // Referência estável para o quadro móvel. A vertical basta porque a guia
  // nunca fica vertical.
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 binormal = normalize(cross(tangent, up));
  vec3 normal = normalize(cross(binormal, tangent));

  /**
   * Em repouso (a = 0) a seção transversal coincide com a normal do quadro —
   * a vertical. É o que deixa a face larga da fita voltada para a câmera:
   * começar pelo binormal a apresentaria de perfil, e uma fita vista de perfil
   * é uma linha.
   */
  float a = twistAngle(t);
  vec3 dir = normal * cos(a) + binormal * sin(a);

  return c + dir * across * uWidth;
}

void main() {
  // O plano chega em [-0.5, 0.5]; t é a posição ao longo do comprimento.
  float t = uv.x - 0.5;
  float across = uv.y - 0.5;

  vec3 p = surfacePoint(t, across);

  // Normal por diferenças finitas sobre a própria superfície deformada.
  float e = 0.0025;
  vec3 du = surfacePoint(t + e, across) - surfacePoint(t - e, across);
  vec3 dv = surfacePoint(t, across + e) - surfacePoint(t, across - e);
  vec3 n = normalize(cross(du, dv));

  // O cursor inclina a instalação inteira, de leve.
  float tilt = uPointer * 0.035;
  mat3 rot = mat3(
    cos(tilt), 0.0, sin(tilt),
    0.0, 1.0, 0.0,
    -sin(tilt), 0.0, cos(tilt)
  );
  p = rot * p;
  n = rot * n;

  vec4 world = modelMatrix * vec4(p, 1.0);
  vNormal = normalize(mat3(modelMatrix) * n);
  vView = normalize(cameraPosition - world.xyz);
  vTwist = twistAngle(t);
  vAcross = across;

  gl_Position = projectionMatrix * viewMatrix * world;
}
`;
