/**
 * Paleta que o WebGL usa.
 *
 * O site é escuro, e só. Existiu por um tempo uma paleta clara paralela — não
 * uma inversão, uma paleta própria, com blending normal no lugar do aditivo,
 * porque somar luz sobre branco não escurece nada. Ela foi avaliada e
 * descartada: a direção é o preto. O que sobrou aqui são os valores do escuro,
 * agora sem indireção.
 *
 * Isto não é um componente e não tem estado — é uma constante. O arquivo
 * mantém o nome para não espalhar renomeações por todas as cenas.
 */
export const GL_PALETTE = {
  light: "#fff8f1",
  accent: "#f97316",
  /**
   * `curve` é o expoente aplicado à cobertura antes de virar alpha.
   *
   * No aditivo a cor também crescia com a densidade, então a resposta era
   * praticamente quadrática — é dela que vêm os cruzamentos quentes e o fundo
   * bem escuro. Separar cor de cobertura tornou tudo linear, e a cena clareou
   * inteira; o expoente devolve o contraste original.
   */
  curve: 1.9,
  gain: 1.15,
  /** Superfícies sólidas (Cena 4): sombra e luz do material. */
  surfaceShadow: "#0b0a09",
  surfaceLight: "#fff8f1",
} as const;
