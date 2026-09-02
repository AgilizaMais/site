/**
 * CENA 2 — ANSIEDADE
 *
 * Quatorze linhas de luz atravessando a tela. Cada uma tem frequência,
 * amplitude, fase e velocidade próprias; `uProgress` interpola todas elas em
 * direção a um valor comum. O caos não é ruído aleatório — é dessincronia. E a
 * calma não é ausência de movimento: é o mesmo movimento, em fase.
 *
 * Restrição de segurança fotossensível: nenhum termo pisca. A luminância de
 * cada linha varia devagar e o somatório é estável ao longo do scrub.
 */
export const linesFrag = /* glsl */ `
precision mediump float;

#define LINES 14

uniform float uTime;
uniform float uProgress;   // 0 = caos · 1 = sincronia
uniform float uAspect;
uniform float uOpacity;
uniform vec3  uColorLight;
uniform vec3  uColorAccent;

varying vec2 vUv;

float hash(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

void main() {
  // Em retrato o domínio horizontal colapsa: cada linha passaria a mostrar
  // meia onda e o campo viraria três curvas soltas. O domínio é mantido
  // próximo do quadrado, e a dispersão vertical se abre para ocupar a tela.
  float portrait = clamp((1.0 - uAspect) / 0.55, 0.0, 1.0);
  float x = (vUv.x - 0.5) * mix(uAspect, 1.2, portrait);
  float y = vUv.y - 0.5;

  // Duas etapas, como a cena narra: primeiro o movimento DESACELERA, só depois
  // as linhas se ALINHAM. Uma curva única faria as duas coisas ao mesmo tempo,
  // e a passagem do caos ao equilíbrio perderia o meio do caminho.
  float decel = smoothstep(0.30, 0.72, uProgress);
  float sync = smoothstep(0.60, 0.86, uProgress);
  float chaos = 1.0 - decel;

  vec3 color = vec3(0.0);

  for (int i = 0; i < LINES; i++) {
    float fi = float(i);
    float r1 = hash(fi * 1.7);
    float r2 = hash(fi * 3.3 + 11.0);
    float r3 = hash(fi * 5.1 + 23.0);

    // Dispersão vertical: espalhadas no caos, reunidas em feixe na sincronia —
    // mas não coladas: o feixe precisa continuar sendo lido como muitas linhas.
    float spread = mix(mix(0.40, 0.66, portrait), mix(0.165, 0.26, portrait), sync);
    float base = ((fi + 0.5) / float(LINES) - 0.5) * 2.0 * spread;
    base += (r1 - 0.5) * 0.30 * (1.0 - sync);
    // No equilíbrio o feixe assenta um pouco abaixo do centro, como um
    // horizonte sob o texto.
    base -= mix(0.16, 0.10, portrait) * sync;

    // Amplitude e velocidade caem na desaceleração; frequência e fase só
    // convergem na sincronização.
    // Em retrato a amplitude precisa ser menor: com o mesmo balanço as linhas
    // saem pela borda e viram traços verticais, perdendo a leitura de feixe.
    float ampScale = mix(1.0, 0.5, portrait);
    float freq = mix(2.2 + r2 * 8.0, 1.3, sync) * mix(1.0, 0.75, portrait);
    float amp = mix(0.085 + r3 * 0.10, 0.026, decel) * ampScale;
    float speed = mix(0.55 + r1 * 1.5, 0.12, decel);
    float phase = mix(r2 * 6.2831853, 0.0, sync);

    float wave = base
      + amp * sin(x * freq + uTime * speed + phase)
      + amp * 0.55 * chaos * sin(x * freq * 2.7 + uTime * speed * 1.9 + r3 * 6.2831853);

    // Tremor de alta frequência, que existe só enquanto há caos.
    wave += 0.004 * chaos * sin(x * 46.0 + uTime * 3.1 + fi);

    float d = abs(y - wave);
    float thickness = (0.0013 + r3 * 0.0011) * mix(1.0, 0.86, sync);
    float glow = thickness / (d + thickness * 0.85);
    glow = pow(glow, 1.5);

    // Um único traço carrega o acento — a assinatura da marca, não um efeito.
    vec3 tint = (i == 9) ? uColorAccent : uColorLight;
    float weight = mix(0.72 + r1 * 0.28, 0.95, sync);

    color += tint * glow * weight;
  }

  color *= mix(0.55, 0.72, portrait);

  // Depois da sincronia, o feixe recua para o fundo: a partir daqui quem
  // conduz é o texto.
  color *= mix(1.0, 0.58, smoothstep(0.86, 1.0, uProgress));

  // Vinheta lateral: as linhas nascem e morrem fora da tela, sem corte seco.
  float edge = smoothstep(0.0, 0.16, vUv.x) * smoothstep(1.0, 0.84, vUv.x);
  color *= edge;

  float a = clamp(max(max(color.r, color.g), color.b), 0.0, 1.0) * uOpacity;
  gl_FragColor = vec4(color * uOpacity, a);
}
`;
