# Edclebia Crochê — *Feito à mão. Feito para marcar.*

Site da artesã Edclebia (crochê autoral, sob medida). A jornada foi desenhada para três momentos:
**abriu → viu a qualidade → encomendou** (WhatsApp).

## Stack

Next.js 15 (App Router, export estático) · React 19 · TypeScript · Three.js (shaders próprios) ·
GSAP + ScrollTrigger · Lenis · CSS Modules.

## Rodando

```bash
cd edclebia-croche
npm install
npm run dev        # http://localhost:3001/edclebiacroche/
npm run build      # gera o site estático em out/
npm run typecheck
npm run lint
```

`?nointro` na URL pula o preloader e a entrada dos fios (útil para prints e QA).

## Publicação — useagilizai.com/edclebiacroche

O site é publicado numa **subpasta**. Por isso o `next.config.mjs` define
`basePath: '/edclebiacroche'` e todo caminho de imagem passa por `asset()` (`lib/asset.ts`).

1. `npm run build` → gera `out/`.
2. Envie **o conteúdo de `out/`** para a pasta `edclebiacroche/` na raiz pública do domínio
   (ex.: `public_html/edclebiacroche/`). O `index.html` precisa ficar dentro dela.

Para mudar de endereço: ajuste `basePath` em `next.config.mjs` e `brand.siteUrl` em
`lib/content.ts` (use `''` no basePath se o site for para a raiz de um domínio).

## Estrutura

| Caminho | O quê |
|---|---|
| `lib/content.ts` | **Toda a copy**, catálogo de peças, WhatsApp, FAQ. Editar textos = editar aqui. |
| `lib/yarn/` | Motor 3D das linhas (ver abaixo) |
| `components/hero/` | Hero: foto da modelo integrada ao 3D, sombras de coqueiro, faixa da coleção |
| `components/collection/` | Vitrine horizontal (pinada no desktop, deslizável no mobile) + filtros |
| `components/quality/` | "O ponto" — letreiro, moldura pespontada, pilares de qualidade |
| `components/process/` | Etapas da encomenda + **Monte seu pedido** (gera a mensagem do WhatsApp) |
| `components/story/` | "A marca" — fios soltos que se enrolam nos dois corações do logo |
| `components/reallife/`, `faq/`, `cta/` | Clientes reais, dúvidas (com JSON-LD), CTA final e rodapé |
| `public/img/` | Fotos (webp). `colecao/` e `vida-real/` vieram do Instagram da cliente |

## As linhas (lib/yarn)

Cada fio é um tubo 3D desenhado inteiramente na GPU, num único *draw call* instanciado:

- **Alma do fio** (`spine.ts`): curva Catmull-Rom centrípeta pelos pontos de controle,
  referenciais por transporte paralelo, gravados a cada frame numa textura float.
- **Física leve** (`YarnEngine.ts`): cada amostra persegue a curva com mola; o cursor (ou o dedo)
  empurra e arrasta os fios; a velocidade do scroll agita as ondas.
- **Textura de linha de verdade** (`shaders.ts`):
  - *fio torcido* — 3–4 cabos em hélice com relevo geométrico na silhueta, sulcos com oclusão,
    fibras em torção contrária e brilho anisotrópico (Kajiya-Kay) ao longo da fibra;
  - *cordão* — colunas de pontos em "V" (tricotin), cada perna com sua própria torção;
  - *toalhinhas* — mandalas de crochê procedurais (anel mágico, varetas, rede, leques, piquinhos).
- **Foto da modelo** fica no DOM, nítida na resolução nativa da tela. Na cena 3D entra só a
  **silhueta** dela (profundidade, sem cor), então os fios passam por trás e pela frente.
- Composições em `presets.ts` (desktop e mobile separados; coordenadas normalizadas).
  O **coração** é um único fio contínuo — sobe, faz um laço pendurado no topo, desce e cruza
  sobre si mesmo na ponta — e ondula em bloco, sem deformar.
- Qualidade adaptada ao aparelho, pausa fora da tela / aba oculta, e modo estático para
  quem prefere menos movimento. Sem WebGL2, fica a foto do DOM e o site segue completo.

### Desempenho (regras para não quebrar)

- **Nada de leitura de layout por quadro**: a caixa da foto é medida só em resize, no handoff
  e no scroll (`syncPhoto`); o retângulo do canvas fica em cache para o ponteiro.
- **Toalhinhas pré-renderizadas**: o shader procedural roda uma vez numa textura; depois só giram.
- **Amostragem adaptativa** (`spine.ts`): mais pontos nas curvas fechadas (coração), menos nas retas.
- **Resolução adaptativa**: se o aparelho cai abaixo de ~48 fps, o canvas reduz o DPR sozinho —
  nunca abaixo de 1.5 em telas retina, e sempre com antisserrilhado (senão o fio serrilha).
- **Entrada pelo relógio real** e shaders compilados antes do 1º quadro (`compileAsync`).
- **Sem `backdrop-filter` sobre o canvas animado** e sem animar elementos dentro de filtros SVG
  (o coqueiro anima a camada inteira) — ambos obrigam o navegador a redesenhar tudo a cada quadro.

### Tipografia

Títulos em **DM Serif Display** (fonte estática). Evite fontes variáveis em tamanhos grandes e
`-webkit-text-stroke`: alguns navegadores mostram as emendas internas dos contornos.

## Pendências com a cliente

- [ ] **Fotos originais** das peças: as atuais foram recortadas de prints do Instagram (≈390 px)
      e ampliadas — funcionam, mas os originais deixam a vitrine muito mais nítida.
- [ ] Confirmar **nomes das peças** (são descritivos, criados para o site), cidade/estado
      (inferido pelo DDD 82 — Alagoas) e como funciona a **entrega**.
- [ ] Autorização das clientes que aparecem em "Na vida real".
