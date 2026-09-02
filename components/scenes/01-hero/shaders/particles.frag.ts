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

  // Âmbar como matéria, branco como luz: a partícula é laranja na penumbra e
  // esquenta até o branco onde a key light bate. É o que dá o aspecto de brasa
  // em vez de plástico laranja.
  vec3 color = mix(uColorAccent, uColorLight, clamp(vKey * vKey * 1.2, 0.0, 1.0));
  color *= 0.26 + vKey * 0.92;
  // Brasa contornando a silhueta.
  color += uColorAccent * vRim * vEdge * 0.65;
  // A onda acende o acento por onde passa.
  color += uColorAccent * vPulse * 0.5;

  // Profundidade: o que está atrás recua, o que está à frente respira.
  float depthFade = mix(1.0, 0.3, vDepth);

  // A luz constrói o volume: o lado iluminado também é mais denso.
  // As dobras agora são desenhadas pela DENSIDADE das partículas (elas caem
  // sobre as cristas), então o brilho não precisa mais carregar o contraste
  // sozinho — modulação mais suave, para as linhas não sumirem na penumbra.
  float a = alpha * uOpacity * depthFade * vTwinkle * vShell
          * mix(0.4, 1.0, vCrown)
          * (0.34 + vKey * 1.05 + vPulse * 0.5);
  a = dither8x8(gl_FragCoord.xy, a);

  gl_FragColor = vec4(color, a);
}
`;
