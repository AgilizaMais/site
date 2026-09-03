import { dither } from '@/lib/gl/noise.glsl';

/**
 * A fita é uma superfície iluminada, não um traço de luz. Duas coisas a
 * tornam legível contra o preto: a diferença entre a face e o avesso — é o que
 * denuncia a torção — e um fio de luz na borda, que devolve a silhueta.
 */
export const ribbonFrag = /* glsl */ `
precision highp float;

uniform vec3  uShadow;
uniform vec3  uLight;
uniform vec3  uAccent;
uniform vec3  uKeyDir;
uniform vec3  uFillDir;
uniform float uOpacity;

varying vec3 vNormal;
varying vec3 vView;
varying float vTwist;
varying float vAcross;

${dither}

void main() {
  // Dupla face: o avesso da fita também recebe luz, senão a torção abre
  // buracos pretos onde a superfície se vira.
  vec3 n = gl_FrontFacing ? vNormal : -vNormal;

  /**
   * Material fosco: uma key light rasante e nenhum brilho especular. Tecido,
   * não plástico. A resposta é contrastada de propósito — a fita fica
   * majoritariamente escura e só as faces que encaram a luz acendem.
   * Iluminada por igual ela viraria uma mancha clara no meio da tela e
   * roubaria a leitura do texto, que é o primeiro plano.
   */
  float key = clamp(dot(n, uKeyDir), 0.0, 1.0);
  float wrap = clamp(dot(n, uKeyDir) * 0.5 + 0.5, 0.0, 1.0);

  // Uma fill fraca do lado oposto. Sem ela existem orientações em que a fita
  // some por completo — e no retrato, onde só um trecho curto aparece, era
  // justamente esse trecho que caía no preto.
  float fill = clamp(dot(n, uFillDir), 0.0, 1.0);

  float lambert = pow(key, 1.7) * 0.76 + wrap * wrap * 0.10 + fill * fill * 0.22;

  /**
   * O avesso é bem mais escuro que a face. É essa diferença — e não a
   * silhueta — que faz o olho ler "torceu" quando a fita se vira.
   *
   * A troca é amortecida perto da rasância: exatamente onde as duas faces se
   * encontram, um degrau seco deixaria um risco preto atravessando a fita.
   */
  float grazing = smoothstep(0.0, 0.20, abs(dot(n, vView)));
  float facing = mix(0.66, gl_FrontFacing ? 1.0 : 0.45, grazing);

  // A fita é fundo: o texto é que precisa ganhar a tela. Um teto de
  // luminância mantém o contraste da copy mesmo no quadro mais claro.
  vec3 color = mix(uShadow, uLight, lambert * 0.40) * facing;

  // O avesso ganha o acento em vez do branco: a laranja aparece só onde a
  // fita se dobra, que é o momento que a cena quer sublinhar.
  color += uAccent * (1.0 - facing) * lambert * 0.55;

  // Fio de luz na borda. Sem ele a fita perde o contorno contra o preto e
  // vira uma mancha.
  float edge = smoothstep(0.42, 0.5, abs(vAcross));
  color += mix(uLight, uAccent, 0.35) * edge * (0.06 + lambert * 0.20);

  /**
   * A dobra — o ponto exato onde a fita fica de perfil para a câmera — acende
   * em laranja. É o único lugar do site onde o acento aparece em área, e é o
   * gesto que a cena inteira existe para mostrar: dobrar não é romper.
   * Sem isso a dobra viraria um risco escuro atravessando a fita.
   */
  float fold = pow(1.0 - clamp(abs(dot(n, vView)), 0.0, 1.0), 2.4);
  color += uAccent * fold * 0.5;

  // O gradiente é longo e escuro: sem o ruído de 1/255 o degradê faz anéis.
  color = vec3(
    dither8x8(gl_FragCoord.xy, color.r),
    dither8x8(gl_FragCoord.xy, color.g),
    dither8x8(gl_FragCoord.xy, color.b)
  );

  gl_FragColor = vec4(color, uOpacity);
}
`;
