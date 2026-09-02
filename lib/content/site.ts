/**
 * Fonte única de conteúdo. Toda copy do site vive aqui, tipada.
 * Textos aprovados em docs/PRD.md §6 e revisados pelo checklist de ética (§9).
 */

export const professional = {
  name: 'Júlia Beatriz',
  role: 'Psicóloga Clínica',
  crp: 'CRP 15/8791',
  education: 'Pós-graduanda em Terapia Cognitivo-Comportamental — PUCRS',
} as const;

export const hero = {
  id: 'inicio',
  headline: ['A mudança', 'acontece', 'em movimento.'],
  subheadline:
    'Um espaço para compreender sua mente com ciência, acolhimento e propósito.',
  cta: { label: 'Iniciar jornada' },
  scrollHint: 'Role para começar',
  /** Descrição da cena WebGL para leitores de tela (o canvas é aria-hidden). */
  canvasDescription:
    'Uma forma humana abstrata composta por milhares de partículas de luz, que respira lentamente no escuro.',
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
export const implementedScenes: readonly SceneId[] = ['inicio'];

export const isImplemented = (id: SceneId) => implementedScenes.includes(id);

/** Próxima cena da jornada a partir de uma dada — ou a atual, se ainda for a última. */
export function nextSceneHref(from: SceneId): string {
  const index = scenes.findIndex((s) => s.id === from);
  const next = scenes[index + 1];
  return next && isImplemented(next.id) ? `#${next.id}` : `#${from}`;
}
