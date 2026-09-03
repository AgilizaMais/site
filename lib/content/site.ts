/**
 * Fonte única de conteúdo. Toda copy do site vive aqui, tipada.
 * Textos aprovados em docs/PRD.md §6 e revisados pelo checklist de ética (§9).
 */

export const professional = {
  name: 'Rafaelle Araújo',
  role: 'Psicóloga Clínica',
  crp: 'CRP 15/8791',
  education: 'Pós-graduanda em Terapia Cognitivo-Comportamental — PUCRS',
} as const;

export const hero = {
  id: 'inicio',
  eyebrow: 'Psicologia clínica',
  /**
   * A última linha carrega o acento. É a única palavra em laranja de toda a
   * primeira tela, e é ela que responde ao caos anunciado na primeira.
   */
  headline: ['Entre o caos', 'e a calma existe', 'um caminho.'],
  headlineAccentFrom: 2,
  subheadline:
    'Um espaço para compreender sua mente com ciência, acolhimento e propósito.',
  /** Só no desktop: no celular o polegar já tem o gesto de rolar. */
  cta: { label: 'Iniciar jornada' },
  scrollHint: 'Role para baixo',
  photoAlt:
    'Rafaelle Araújo, psicóloga clínica, sentada, apoiando o queixo na mão.',
  /** Descrição da cena WebGL para leitores de tela (o canvas é aria-hidden). */
  canvasDescription:
    'Um cérebro humano abstrato, desenhado por milhares de partículas âmbar que percorrem seus sulcos e respiram lentamente no escuro. Algumas delas se soltam e passam à frente da fotografia, contornando o ombro e a borda do cabelo.',
} as const;

/**
 * Índice da jornada, no rodapé da primeira tela do desktop. Não é navegação —
 * é sumário: diz de que o site trata antes de pedir qualquer rolagem.
 *
 * No celular ele não existe: ali a primeira tela é a fotografia e a frase, e
 * mais nada.
 */
export const heroIndex = {
  items: [
    { id: 'ansiedade', label: 'Ansiedade', line: 'Compreender para viver com mais leveza.' },
    { id: 'autoestima', label: 'Autoestima', line: 'Reconhecer seu valor além das expectativas.' },
    { id: 'flexibilidade', label: 'Flexibilidade', line: 'Adaptação que fortalece, não que desgasta.' },
    { id: 'aceitacao', label: 'Aceitação', line: 'Acolher o que é real abre espaço para o novo.' },
  ],
  credential: {
    label: 'TCC',
    line: 'Pós-graduanda em Terapia Cognitivo-Comportamental, PUCRS.',
  },
} as const;

export const anxiety = {
  id: 'ansiedade',
  eyebrow: 'Ansiedade',
  headline: ['Nem todo ruído', 'precisa virar alarme.'],
  body:
    'A ansiedade não é um defeito — é um sistema de proteção funcionando em excesso. ' +
    'No processo terapêutico, aprendemos a reconhecer o padrão, entender o que ele tenta ' +
    'proteger e devolver ao corpo a possibilidade de escolha.',
  canvasDescription:
    'Linhas de luz atravessam a tela. Começam desencontradas e trêmulas e, conforme a página avança, desaceleram até se alinharem em um feixe único e calmo.',
} as const;

export const selfEsteem = {
  id: 'autoestima',
  eyebrow: 'Autoestima',
  headline: ['A imagem que você tem', 'de si também é aprendida.'],
  body:
    'Autoestima não é gostar de tudo em si o tempo todo. É construir uma relação mais justa ' +
    'com a própria história — reconhecendo distorções sem se reduzir a elas.',
  canvasDescription:
    'Um painel translúcido flutua sobre um campo de luz. O que se vê através dele chega deslocado e desfocado; quando o movimento cessa, a imagem volta ao lugar.',
} as const;

export const flexibility = {
  id: 'flexibilidade',
  eyebrow: 'Flexibilidade psicológica',
  headline: ['Dobrar', 'não é romper.'],
  body:
    'Flexibilidade é a capacidade de permanecer em contato com o que é difícil e ainda assim ' +
    'agir na direção do que importa para você.',
  canvasDescription:
    'Uma fita larga atravessa a tela. Conforme a página avança ela se torce e se dobra sobre si mesma, absorve o movimento e volta a correr contínua — em nenhum momento se parte.',
} as const;

export const nav = {
  links: [
    { id: 'sobre', label: 'Sobre', href: '#sobre' },
    { id: 'processo', label: 'Processo', href: '#processo' },
  ],
  cta: { id: 'agendar', label: 'Agendar', href: '#agendar' },
} as const;

export const scenes = [
  { id: 'inicio', label: 'Início' },
  { id: 'ansiedade', label: 'Ansiedade' },
  { id: 'autoestima', label: 'Autoestima' },
  { id: 'flexibilidade', label: 'Flexibilidade psicológica' },
  { id: 'aceitacao', label: 'Aceitação' },
  { id: 'sobre', label: 'Sobre' },
  { id: 'processo', label: 'Processo' },
  { id: 'agendar', label: 'Agendar' },
] as const;

export type SceneId = (typeof scenes)[number]['id'];

/**
 * Construção por etapas: o site cresce uma cena por vez (docs/ARCHITECTURE.md §9).
 * A navegação só oferece o que já existe — nenhuma âncora morta chega ao usuário.
 * Ao entregar uma cena, basta acrescentar o id aqui.
 */
const built: readonly SceneId[] = ['inicio', 'ansiedade', 'autoestima', 'flexibilidade'];

/**
 * Recorte de build, para prévias.
 *
 * `NEXT_PUBLIC_SCENES=inicio,ansiedade` gera um site que vai só até a Cena 2 —
 * é o que se manda para a cliente ver uma etapa antes das outras existirem.
 * O recorte passa por AQUI, e não por um `page.tsx` alternativo, porque este é
 * o registro que a navegação, o sumário da primeira tela e o CTA "Iniciar
 * jornada" já consultam: cortar aqui corta tudo junto, sem âncora morta.
 *
 * A variável é lida em tempo de build (o Next a inlina), então a versão
 * completa não carrega uma linha de código a mais por causa disto.
 */
const requested = process.env.NEXT_PUBLIC_SCENES?.split(',')
  .map((id) => id.trim())
  .filter(Boolean);

export const implementedScenes: readonly SceneId[] =
  requested && requested.length > 0
    ? built.filter((id) => requested.includes(id))
    : built;

export const isImplemented = (id: SceneId) => implementedScenes.includes(id);

/** Próxima cena da jornada a partir de uma dada — ou a atual, se ainda for a última. */
export function nextSceneHref(from: SceneId): string {
  const index = scenes.findIndex((s) => s.id === from);
  const next = scenes[index + 1];
  return next && isImplemented(next.id) ? `#${next.id}` : `#${from}`;
}
