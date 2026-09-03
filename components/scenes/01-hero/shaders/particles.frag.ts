import { dither } from '@/lib/gl/noise.glsl';

export const particlesFrag = /* glsl */ `
precision mediump float;

uniform vec3  uColorLight;
uniform vec3  uColorAccent;
uniform float uOpacity;
uniform float uGain;   // compensa a troca de blending entre os temas

varying float vBrightness;
varying float vWarmth;
varying float vTwinkle;
varying float vDepth;
varying float vPulse;

${dither}

void main() {
  // Disco de núcleo sólido com borda fina de antisserrilhado — e não um
  // gradiente até o centro. A queda suave transforma cada partícula num
  // pequeno halo, e a soma dos halos é o que dá o aspecto "brilhoso".
  vec2 uv = gl_PointCoord - 0.5;
  float d = dot(uv, uv);
  // A borda é estreita de propósito: quanto mais larga a transição, mais cada
  // partícula vira halo, e a soma dos halos é o que empasta o desenho.
  float alpha = 1.0 - smoothstep(0.155, 0.225, d);
  if (alpha < 0.01) discard;

  // Âmbar como matéria, branco como luz. O calor vem da própria partícula,
  // amostrado da imagem-fonte, então o desenho preserva a iluminação original
  // sem precisar recalculá-la.
  vec3 color = mix(uColorAccent, uColorLight, vWarmth);
  // O âmbar tem menos da metade da luminância do branco, então o conjunto
  // pede mais ganho do que pedia quando a maioria das partículas era clara.
  color *= 0.45 + vBrightness * 1.55;
  // A onda acende o acento por onde passa.
  color += uColorAccent * vPulse * 0.42;

  float depthFade = mix(1.0, 0.55, vDepth);
  float a = alpha * uOpacity * vTwinkle * depthFade * (0.25 + vBrightness * 0.95 + vPulse * 0.45);
  a = dither8x8(gl_FragCoord.xy, a);

  gl_FragColor = vec4(color, a);
}
`;
