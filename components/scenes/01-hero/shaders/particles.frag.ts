import { dither } from '@/lib/gl/noise.glsl';

export const particlesFrag = /* glsl */ `
precision mediump float;

uniform vec3  uColorLight;
uniform vec3  uColorAccent;
uniform float uOpacity;

varying float vKey;
varying float vRim;
varying float vSeed;
varying float vDepth;
varying float vShell;

${dither}

void main() {
  // Ponto redondo com queda suave — sem textura, sem fetch.
  vec2 uv = gl_PointCoord - 0.5;
  float d = dot(uv, uv);
  float alpha = smoothstep(0.25, 0.0, d);
  if (alpha < 0.01) discard;

  // Iluminação: branco quente na key, laranja apenas na borda.
  // O rim soma luz em vez de tingir: o branco continua branco e a borda
  // quente aparece como brasa, não como ruído vermelho.
  vec3 color = uColorLight * (0.10 + vKey * 1.15);
  color += uColorAccent * vRim * vShell * 0.9;

  // Profundidade: o que está atrás recua, o que está à frente respira.
  float depthFade = mix(1.0, 0.32, vDepth);
  float twinkle = 0.85 + 0.15 * vSeed;

  // O lado iluminado também é mais denso: a luz constrói o volume.
  float a = alpha * uOpacity * depthFade * twinkle
          * (0.06 + vShell * 0.94)
          * (0.45 + vKey * 0.85 + vRim * 0.5);
  a = dither8x8(gl_FragCoord.xy, a);

  gl_FragColor = vec4(color, a);
}
`;
