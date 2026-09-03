import { dither } from '@/lib/gl/noise.glsl';

export const sparksFrag = /* glsl */ `
precision mediump float;

uniform vec3  uColorLight;
uniform vec3  uColorAccent;
uniform float uOpacity;

varying float vBrightness;
varying float vWarmth;
varying float vTwinkle;

${dither}

void main() {
  // Núcleo sólido, borda fina de antisserrilhado. Um gradiente até o centro
  // transformaria cada faísca num halo, e a soma dos halos é o que embaça.
  vec2 uv = gl_PointCoord - 0.5;
  float d = dot(uv, uv);
  float alpha = 1.0 - smoothstep(0.14, 0.23, d);
  if (alpha < 0.01) discard;

  vec3 color = mix(uColorAccent, uColorLight, vWarmth);
  color *= 0.45 + vBrightness * 1.05;

  float a = alpha * uOpacity * vTwinkle * vBrightness;
  a = dither8x8(gl_FragCoord.xy, a);
  if (a < 0.004) discard;

  gl_FragColor = vec4(color, a);
}
`;
