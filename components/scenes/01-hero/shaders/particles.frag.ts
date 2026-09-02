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
varying float vPulse;
varying float vTwinkle;

${dither}

void main() {
  // Ponto redondo com queda suave — sem textura, sem fetch.
  vec2 uv = gl_PointCoord - 0.5;
  float d = dot(uv, uv);
  float alpha = smoothstep(0.25, 0.0, d);
  if (alpha < 0.01) discard;

  // O rim soma luz em vez de tingir: o branco continua branco e a borda
  // quente aparece como brasa, não como ruído vermelho.
  vec3 color = uColorLight * (0.10 + vKey * 1.15);
  color += uColorAccent * vRim * vShell * 0.9;
  // A onda acende o acento por onde passa.
  color += uColorAccent * vPulse * 0.75;

  // Profundidade: o que está atrás recua, o que está à frente respira.
  float depthFade = mix(1.0, 0.3, vDepth);

  // A luz constrói o volume: o lado iluminado também é mais denso.
  float a = alpha * uOpacity * depthFade * vTwinkle
          * (0.42 + vShell * 0.58)
          * (0.4 + vKey * 0.9 + vRim * 0.5 + vPulse * 0.6);
  a = dither8x8(gl_FragCoord.xy, a);

  gl_FragColor = vec4(color, a);
}
`;
