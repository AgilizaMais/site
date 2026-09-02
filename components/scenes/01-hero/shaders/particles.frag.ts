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
varying float vEdge;
varying float vCrown;
varying float vPulse;
varying float vTwinkle;

${dither}

void main() {
  // Disco de núcleo sólido com uma borda fina de antisserrilhado — e não um
  // gradiente até o centro. A queda suave transformava cada partícula num
  // pequeno halo, e o somatório desses halos era o aspecto "brilhoso".
  vec2 uv = gl_PointCoord - 0.5;
  float d = dot(uv, uv);
  float alpha = 1.0 - smoothstep(0.12, 0.25, d);
  if (alpha < 0.01) discard;

  // O rim soma luz em vez de tingir: o branco continua branco e a borda
  // quente aparece como brasa, não como ruído vermelho.
  vec3 color = uColorLight * (0.07 + vKey * 1.35);
  // O acento vive na borda da silhueta: brasa contornando a forma.
  color += uColorAccent * vRim * vEdge * 1.15;
  // A onda acende o acento por onde passa.
  color += uColorAccent * vPulse * 0.75;

  // Profundidade: o que está atrás recua, o que está à frente respira.
  float depthFade = mix(1.0, 0.3, vDepth);

  // A luz constrói o volume: o lado iluminado também é mais denso.
  float a = alpha * uOpacity * depthFade * vTwinkle * vShell
          * mix(0.12, 1.0, vCrown)
          * (0.42 + vKey * 0.95 + vPulse * 0.55);
  a = dither8x8(gl_FragCoord.xy, a);

  gl_FragColor = vec4(color, a);
}
`;
