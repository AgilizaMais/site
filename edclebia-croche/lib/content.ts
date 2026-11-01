import { asset } from './asset';

/**
 * Fonte única de conteúdo do site. Toda copy, contato e catálogo vivem aqui.
 *
 * ⚠️ Revisar com a Edclebia antes de publicar:
 *  - nomes das peças (são descritivos, criados para o site);
 *  - cidade/estado (inferido pelo DDD 82 — Alagoas);
 *  - formas de entrega e prazos (o site evita prometer prazos: tudo é combinado no WhatsApp).
 */

export const brand = {
  name: 'Edclebia Crochê',
  artisan: 'Edclebia',
  tagline: 'Feito à mão. Feito para marcar.',
  region: 'Alagoas',
  instagram: {
    handle: '@edclebiacroche',
    url: 'https://www.instagram.com/edclebiacroche/',
  },
  whatsapp: {
    /** E.164 sem o "+" — formato do wa.me */
    number: '5582993399005',
    display: '(82) 99339-9005',
  },
  siteUrl: 'https://useagilizai.com/edclebiacroche',
} as const;

/** Link de WhatsApp com mensagem pré-preenchida. */
export function waLink(message?: string): string {
  const base = `https://wa.me/${brand.whatsapp.number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const defaultWaMessage =
  'Olá, Edclebia! Vim pelo site e quero saber mais sobre as peças em crochê. 💗';

export const nav = [
  { id: 'inicio', label: 'Início' },
  { id: 'colecao', label: 'Coleção' },
  { id: 'sob-medida', label: 'Sob medida' },
  { id: 'a-marca', label: 'A marca' },
] as const;

export const hero = {
  eyebrow: 'Ateliê de crochê autoral',
  title: ['Feito à mão.', 'Feito para'],
  accent: 'marcar.',
  subtitle: 'Peças em crochê que transformam fios em presença.',
  ctaPrimary: 'Explorar coleção',
  ctaSecondary: 'Encomendar a minha',
  card: 'feito com tempo, cuidado e identidade',
  proof: ['Sob medida', 'Peças únicas', 'Direto com a artesã'],
  scroll: 'role para sentir a textura',
  modelAlt:
    'Modelo usando saída de praia frente única em crochê cru, com trama aberta e franjas longas na barra.',
} as const;

export type Category = 'vestidos' | 'praia' | 'tops' | 'especiais';

export const categories: { id: Category | 'todas'; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'vestidos', label: 'Vestidos' },
  { id: 'praia', label: 'Moda praia' },
  { id: 'tops', label: 'Tops & conjuntos' },
  { id: 'especiais', label: 'Peças especiais' },
];

export type Product = {
  slug: string;
  name: string;
  category: Category;
  note: string;
  /** Tonalidade dominante — usada no brilho do card */
  tone: string;
  image: string;
};

export const products: Product[] = [
  {
    slug: 'vestido-franjas-perola',
    name: 'Vestido Franjas Pérola',
    category: 'vestidos',
    note: 'Frente única com franjas longas que dançam a cada passo.',
    tone: '#efe9e2',
    image: asset('/img/colecao/vestido-franjas-perola.webp'),
  },
  {
    slug: 'vestido-esmeralda',
    name: 'Vestido Esmeralda',
    category: 'vestidos',
    note: 'Decote em V, losango central rendado e barra em franjas.',
    tone: '#1f8a78',
    image: asset('/img/colecao/vestido-esmeralda.webp'),
  },
  {
    slug: 'conjunto-dourado-sol',
    name: 'Conjunto Dourado Sol',
    category: 'praia',
    note: 'Top e saia em fio dourado, cintura marcada e rede aberta.',
    tone: '#b88a2c',
    image: asset('/img/colecao/conjunto-dourado-sol.webp'),
  },
  {
    slug: 'vestido-longo-aurora',
    name: 'Vestido Longo Aurora',
    category: 'especiais',
    note: 'Top de biquíni, recortes laterais e saia longa rendada.',
    tone: '#f2efea',
    image: asset('/img/colecao/vestido-longo-aurora.webp'),
  },
  {
    slug: 'vestido-mosaico-espelhado',
    name: 'Vestido Mosaico',
    category: 'especiais',
    note: 'Quadrados vazados com espelhos aplicados que refletem a luz.',
    tone: '#a06a35',
    image: asset('/img/colecao/vestido-mosaico-espelhado.webp'),
  },
  {
    slug: 'top-brisa-paetes',
    name: 'Top Brisa',
    category: 'tops',
    note: 'Frente única com barra em ponta e paetês que brilham ao sol.',
    tone: '#e9e4dc',
    image: asset('/img/colecao/top-brisa-paetes.webp'),
  },
  {
    slug: 'vestido-sereia',
    name: 'Vestido Sereia',
    category: 'especiais',
    note: 'Manga longa e silhueta sereia — para casar, celebrar, marcar.',
    tone: '#f4f2ee',
    image: asset('/img/colecao/vestido-sereia.webp'),
  },
  {
    slug: 'vestido-granny-vitral',
    name: 'Vestido Vitral',
    category: 'vestidos',
    note: 'Quadradinhos granny em cores vibrantes, do decote à barra.',
    tone: '#d2333f',
    image: asset('/img/colecao/vestido-granny-vitral.webp'),
  },
  {
    slug: 'biquini-morango',
    name: 'Biquíni Morango',
    category: 'praia',
    note: 'Bojo em formato de morango com sementinhas bordadas.',
    tone: '#d42a2a',
    image: asset('/img/colecao/biquini-morango.webp'),
  },
  {
    slug: 'top-gotas-douradas',
    name: 'Top Gotas Douradas',
    category: 'tops',
    note: 'Rede off-white com paetês dourados e amarração nas costas.',
    tone: '#e8dcc0',
    image: asset('/img/colecao/top-gotas-douradas.webp'),
  },
  {
    slug: 'vestido-noite',
    name: 'Vestido Noite',
    category: 'especiais',
    note: 'Longo preto em ponto aberto com aplicações em gota.',
    tone: '#2a2a2a',
    image: asset('/img/colecao/vestido-noite.webp'),
  },
  {
    slug: 'camisa-granny',
    name: 'Camisa Granny',
    category: 'tops',
    note: 'Camisa masculina em quadradinhos — crochê também é para eles.',
    tone: '#6d8f3d',
    image: asset('/img/colecao/camisa-granny.webp'),
  },
];

export function productMessage(p: Product) {
  return `Olá, Edclebia! Vi o *${p.name}* no site e quero encomendar. Pode me passar os detalhes? 💗`;
}

export const collection = {
  eyebrow: 'Coleção autoral',
  title: 'Texturas que contam',
  accent: 'histórias.',
  intro:
    'Cada peça é feita sob encomenda, ponto a ponto. Escolha um modelo, a cor do fio e as suas medidas — o resto é com as mãos da Edclebia.',
  cardCta: 'Quero essa',
} as const;

export const quality = {
  eyebrow: 'O ponto',
  title: 'Qualidade que se sente',
  accent: 'no toque.',
  intro:
    'Crochê de verdade não tem atalho. São horas de agulha e fio para que cada peça vista bem, tenha caimento e dure.',
  pillars: [
    {
      icon: 'hands',
      title: 'Feito à mão, ponto a ponto',
      text: 'Nada de produção em série: cada peça é feita individualmente, do primeiro ao último ponto.',
    },
    {
      icon: 'ruler',
      title: 'Modelagem no seu corpo',
      text: 'Medidas, comprimento e ajustes pensados para vestir você — não um manequim padrão.',
    },
    {
      icon: 'palette',
      title: 'A cor que você quiser',
      text: 'Do off-white ao pink, do dourado ao verde: a peça nasce na cor que combina com você.',
    },
    {
      icon: 'spark',
      title: 'Acabamento caprichado',
      text: 'Arremates firmes, franjas alinhadas e detalhes como paetês e espelhos aplicados à mão.',
    },
  ],
} as const;

export const processSteps = {
  eyebrow: 'Sob medida',
  title: 'Da sua ideia à sua',
  accent: 'peça.',
  intro: 'Encomendar é simples, e tudo é combinado direto com a artesã — sem intermediários.',
  steps: [
    {
      n: '01',
      title: 'Escolha o modelo',
      text: 'Da coleção, do Instagram ou daquela referência que você salvou. A Edclebia adapta.',
    },
    {
      n: '02',
      title: 'Conversa no WhatsApp',
      text: 'Cor do fio, medidas, detalhes e prazo — tudo alinhado antes do primeiro ponto.',
    },
    {
      n: '03',
      title: 'Feito à mão para você',
      text: 'Sua peça ganha forma ponto a ponto, com todo o tempo e cuidado que ela merece.',
    },
    {
      n: '04',
      title: 'Chega até você',
      text: 'Pronta, conferida e embalada com carinho. A entrega é combinada com você.',
    },
  ],
} as const;

export const builder = {
  eyebrow: 'Monte seu pedido',
  title: 'Comece sua encomenda',
  accent: 'agora.',
  intro:
    'Escolha as opções e envie direto para o WhatsApp da Edclebia. Ela responde para fechar os detalhes com você.',
  pieces: ['Vestido', 'Saída de praia', 'Conjunto', 'Top / Cropped', 'Biquíni', 'Peça masculina', 'Outra ideia'],
  occasions: ['Praia & verão', 'Festa', 'Casamento & eventos', 'São João', 'Dia a dia'],
  sizes: ['PP', 'P', 'M', 'G', 'GG', 'Sob medida'],
  colors: [
    { id: 'off-white', label: 'Off-white', hex: '#F1E8DA' },
    { id: 'areia', label: 'Areia', hex: '#D9C2A0' },
    { id: 'dourado', label: 'Dourado', hex: '#C4972F' },
    { id: 'pink', label: 'Pink', hex: '#E9447A' },
    { id: 'lilas', label: 'Lilás', hex: '#7B63C6' },
    { id: 'esmeralda', label: 'Esmeralda', hex: '#1F8A78' },
    { id: 'terracota', label: 'Terracota', hex: '#B4593A' },
    { id: 'preto', label: 'Preto', hex: '#1E1A1D' },
  ],
  send: 'Enviar pedido no WhatsApp',
  preview: 'Prévia da mensagem',
} as const;

export const story = {
  eyebrow: 'A marca',
  title: ['Crochê é arte,', 'é estilo, é'],
  accent: 'você.',
  paragraphs: [
    'A Edclebia Crochê nasceu do amor pelo fio e pela agulha. Cada peça carrega horas de dedicação para virar algo que é só seu.',
    'Da praia à festa, do São João ao casamento: são vestidos, tops, conjuntos e peças especiais criados com identidade nordestina e acabamento de ateliê.',
  ],
  signature: 'Edclebia',
  signatureRole: 'artesã e criadora',
} as const;

export const realLife = {
  eyebrow: 'Na vida real',
  title: 'Quem veste,',
  accent: 'marca presença.',
  cta: 'Ver mais no Instagram',
  photos: [
    { src: asset('/img/vida-real/vestido-pink.webp'), alt: 'Cliente com vestido pink de franjas em crochê' },
    { src: asset('/img/vida-real/top-dourado-cruzeiro.webp'), alt: 'Cliente com top dourado em crochê a bordo de um navio' },
    { src: asset('/img/vida-real/amigas.webp'), alt: 'Duas amigas com top de rosas azuis e top dourado em crochê' },
    { src: asset('/img/vida-real/franjas-festa.webp'), alt: 'Cliente com vestido branco de franjas em uma festa' },
    { src: asset('/img/vida-real/touca.webp'), alt: 'Cliente usando touca de crochê em tom areia' },
    { src: asset('/img/vida-real/dourado-noite.webp'), alt: 'Cliente com conjunto dourado de crochê à noite' },
  ],
} as const;

export const faq = {
  eyebrow: 'Dúvidas',
  title: 'Perguntas',
  accent: 'frequentes.',
  items: [
    {
      q: 'Como faço uma encomenda?',
      a: 'É só chamar no WhatsApp com o modelo que você gostou (ou a sua ideia). A Edclebia confirma cor, medidas, valor e prazo antes de começar.',
    },
    {
      q: 'Quanto tempo leva para ficar pronta?',
      a: 'Depende do modelo — um top é bem mais rápido que um vestido longo. O prazo é combinado com você no atendimento, antes do primeiro ponto.',
    },
    {
      q: 'Posso escolher a cor e o tamanho?',
      a: 'Sim! As peças são feitas sob encomenda, então você escolhe a cor do fio e envia suas medidas para a peça vestir do jeito certo.',
    },
    {
      q: 'Como tiro minhas medidas?',
      a: 'Com uma fita métrica: busto, cintura, quadril e o comprimento desejado. No WhatsApp a Edclebia explica o passo a passo para cada modelo.',
    },
    {
      q: 'Como cuidar da minha peça de crochê?',
      a: 'Lave à mão com sabão neutro e água fria, sem torcer. Seque à sombra, na horizontal, para a peça não deformar. Guarde dobrada, nunca no cabide.',
    },
  ],
} as const;

export const finalCta = {
  title: 'Sua próxima peça favorita começa com um',
  accent: 'oi.',
  text: 'Conte o que você imagina. A Edclebia transforma em fio, ponto e presença.',
  button: 'Chamar no WhatsApp',
} as const;
