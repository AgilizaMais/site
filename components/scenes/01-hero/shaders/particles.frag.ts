import { dither } from '@/lib/gl/noise.glsl';

export const particlesFrag = /* glsl */ `
precision mediump float;

uniform vec3  uColorLight;
uniform vec3  uColorAccent;
uniform float uOpacity;

varying float vBrightness;
varying float vWarmth;
varying float vTwinkle;
varying float vDepth;

${dither}

void main() {
  // Disco de núcleo sólido com borda fina de antisserrilhado — e não um
  // gradiente até o centro. A queda suave transforma cada partícula num
  // pequeno halo, e a soma dos halos é o que dá o aspecto "brilhoso".
  vec2 uv = gl_PointCoord - 0.5;
  float d = dot(uv, uv);
  float alpha = 1.0 - smoothstep(0.12, 0.25, d);
  if (alpha < 0.01) discard;

  // Âmbar como matéria, branco como luz. O calor vem da própria partícula,
  // amostrado da imagem-fonte, então o desenho preserva a iluminação original
  // sem precisar recalculá-la.
  vec3 color = mix(uColorAccent, uColorLight, vWarmth);
  color *= 0.3 + vBrightness * 1.15;

  float depthFade = mix(1.0, 0.55, vDepth);
  float a = alpha * uOpacity * vTwinkle * depthFade * (0.25 + vBrightness * 0.95);
  a = dither8x8(gl_FragCoord.xy, a);

  gl_FragColor = vec4(color, a);
}
`;
