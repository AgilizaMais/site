/**
 * CENA 3 — AUTOESTIMA
 *
 * Um campo de luz e, sobre ele, um painel translúcido. O que se vê através do
 * painel chega deslocado, desfocado e com as cores levemente separadas — e
 * volta ao lugar quando o movimento cessa.
 *
 * A metáfora é de percepção, não de espelho: o painel não devolve a imagem,
 * ele a filtra. Por isso a distorção é sutil e sempre reversível.
 */
export const glassFrag = /* glsl */ `
precision mediump float;

uniform float uTime;
uniform float uAspect;
uniform float uStrength;    // 0 = repouso · 1 = distorção máxima
uniform float uOpacity;
uniform vec2  uPointer;     // em UV
uniform vec2  uPanelCenter; // em UV, medido no DOM
uniform vec2  uPanelHalf;   // em UV
uniform float uRadius;      // canto arredondado, em UV de altura
uniform vec3  uColorLight;
uniform vec3  uColorAccent;
uniform float uGain;      // compensa a troca de blending entre os temas
uniform float uCurve;     // expoente da cobertura: contraste da cena
uniform float uGlassBody; // >1 adensa (luz), <1 clareia (tinta sobre papel)

varying vec2 vUv;

/**
 * Campo de luz atrás do painel.
 *
 * Precisa ter ESTRUTURA FINA, não um gradiente: é o deslocamento das
 * estriações que torna a refração visível. Um campo liso atravessa o vidro
 * sem revelar nada, e o painel vira uma placa colorida.
 */
vec4 field(vec2 uv) {
  vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);

  // Estriações verticais, onduladas devagar.
  float warp = sin(p.y * 2.6 + uTime * 0.08) * 0.22 + sin(p.y * 5.1 - uTime * 0.05) * 0.09;
  // Frequência alta de propósito: quanto mais finas as estriações, mais o
  // olho percebe o deslocamento que o vidro provoca. Faixas largas atravessam
  // o painel quase inteiras e a refração desaparece.
  float stripes = sin((p.x + warp) * 88.0 + uTime * 0.1) * 0.5 + 0.5;
  stripes = pow(stripes, 2.2);

  // Ondulação larga por baixo, que dá volume ao conjunto.
  float swell = sin(p.x * 3.1 + p.y * 1.7 - uTime * 0.06) * 0.5 + 0.5;

  // A luz se concentra atrás do painel: o campo é a fonte que o vidro filtra,
  // não um papel de parede.
  vec2 d = (uv - uPanelCenter) / vec2(uPanelHalf.x * 2.2, uPanelHalf.y * 1.7);
  float glow = exp(-dot(d, d) * 2.0);

  float intensity = (0.02 + stripes * 0.20 + swell * 0.045) * (0.085 + glow * 2.2);

  // Branco quente domina; o âmbar entra como temperatura, não como cor.
  //
  // Devolve a TINTA e a INTENSIDADE separadas: derivar o alpha da luminância
  // funciona enquanto o desenho é luz sobre o preto, mas com tinta escura
  // sobre papel a luminância é baixa por definição e o campo sumiria.
  vec3 tint = mix(uColorLight, uColorAccent, 0.1 + stripes * 0.2);
  return vec4(tint, intensity);
}

/**
 * Distância com sinal a um retângulo de cantos arredondados.
 * O parâmetro não pode se chamar half: é palavra reservada em GLSL.
 */
float sdRoundRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
  vec2 uv = vUv;

  // Coordenadas corrigidas por aspecto, para o canto arredondado não deformar.
  vec2 local = (uv - uPanelCenter) * vec2(uAspect, 1.0);
  vec2 halfSize = uPanelHalf * vec2(uAspect, 1.0);
  float d = sdRoundRect(local, halfSize, uRadius);

  // Máscara do painel, com borda de antisserrilhado proporcional ao pixel.
  float aa = fwidth(d) * 1.5 + 0.0008;
  float inside = 1.0 - smoothstep(-aa, aa, d);

  vec4 base = field(uv);
  vec3 color = base.rgb;
  float cov = base.a;

  if (inside > 0.001) {
    // Curvatura de lente: o deslocamento cresce em direção às bordas, como
    // num vidro real. No centro a imagem quase não se move.
    vec2 n = local / halfSize;
    float edge = clamp(dot(n, n), 0.0, 1.0);

    // O cursor inclina o painel: o eixo do deslocamento acompanha a mão.
    vec2 toPointer = (uPointer - uPanelCenter) * vec2(uAspect, 1.0);
    vec2 tilt = clamp(toPointer / max(halfSize.y, 0.001), -1.5, 1.5);

    vec2 disp = (n * edge * 0.075 + tilt * 0.016) * uStrength;

    // Dispersão cromática: os canais atravessam o vidro por caminhos
    // ligeiramente diferentes. Mantida abaixo de 1.5px na escala da tela.
    float spread = 0.008 * uStrength;
    vec4 fr = field(uv + disp * (1.0 + spread));
    vec4 fg = field(uv + disp);
    vec4 fb = field(uv + disp * (1.0 - spread));

    // A dispersão separa os canais da COMPOSIÇÃO (tinta × intensidade), que é
    // o que o olho enxerga atravessando o vidro.
    vec3 refracted = vec3(fr.r * fr.a, fg.g * fg.a, fb.b * fb.a);
    float refractedCov = (fr.a + fg.a + fb.a) / 3.0;
    vec3 refractedTint = fg.rgb;

    // Blur físico por amostragem cruzada — quatro toques bastam num campo
    // desta suavidade, e o custo por pixel continua trivial.
    float blur = 0.0045 * uStrength;
    vec4 b1 = field(uv + disp + vec2(blur, 0.0));
    vec4 b2 = field(uv + disp + vec2(-blur, 0.0));
    vec4 b3 = field(uv + disp + vec2(0.0, blur));
    vec4 b4 = field(uv + disp + vec2(0.0, -blur));

    float softCov = (refractedCov + b1.a + b2.a + b3.a + b4.a) / 5.0;
    float glassCov = mix(refractedCov, softCov, 0.75);

    // O vidro tem corpo. No escuro isso adensa a luz que atravessa; no claro,
    // vidro fosco sobre papel espalha e CLAREIA — adensar deixaria o painel
    // como uma placa preta.
    glassCov *= uGlassBody;

    cov = mix(cov, glassCov, inside);
    color = mix(color, refractedTint, inside);
  }

  // Aresta do painel: uma linha fina de luz, mais viva onde o cursor está.
  float rim = exp(-abs(d) * 420.0);
  float pointerBias = 1.0 - clamp(length((uv - uPointer) * vec2(uAspect, 1.0)) * 1.8, 0.0, 0.85);
  float rimCov = rim * (0.5 + 1.1 * pointerBias);
  color = mix(color, mix(uColorLight, uColorAccent, 0.45), clamp(rimCov, 0.0, 1.0));
  cov += rimCov * 0.22;

  // Vinheta: o campo nasce e morre sem corte.
  float edgeX = smoothstep(0.0, 0.14, uv.x) * smoothstep(1.0, 0.86, uv.x);
  float edgeY = smoothstep(0.0, 0.1, uv.y) * smoothstep(1.0, 0.9, uv.y);
  cov *= edgeX * edgeY;

  float a = clamp(pow(clamp(cov * 1.9, 0.0, 1.6), uCurve) * uGain, 0.0, 1.0) * uOpacity;
  gl_FragColor = vec4(color, a);
}
`;
