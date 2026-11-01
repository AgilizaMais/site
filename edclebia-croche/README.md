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
npm run dev        # http://localhost:3001
npm run build      # gera o site estático em out/
npm run typecheck
npm run lint
```

`?nointro` na URL pula o preloader e a entrada dos fios (útil para prints e QA).

## Publicação

O build gera HTML/CSS/JS puros em `out/` — sobe em qualquer hospedagem.
Na Vercel/Netlify, aponte o **Root Directory** para `edclebia-croche`.
Antes de publicar, ajuste o domínio em `brand.siteUrl` (`lib/content.ts`).

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
- **Foto da modelo** entra na mesma cena 3D: os fios passam por trás e pela frente dela, e as
  franjas do vestido balançam (a pele é protegida da ondulação).
- Composições em `presets.ts` (desktop e mobile separados; coordenadas normalizadas).
- Qualidade adaptada ao aparelho, pausa fora da tela / aba oculta, e modo estático para
  quem prefere menos movimento. Sem WebGL2, fica a foto do DOM e o site segue completo.

## Pendências com a cliente

- [ ] **Fotos originais** das peças: as atuais foram recortadas de prints do Instagram (≈390 px)
      e ampliadas — funcionam, mas os originais deixam a vitrine muito mais nítida.
- [ ] **PNG da modelo com transparência real**: o arquivo recebido tinha o "xadrez" gravado na
      imagem; o fundo foi removido aqui, mas sobram imperfeições discretas nas franjas.
- [ ] Confirmar **nomes das peças** (são descritivos, criados para o site), cidade/estado
      (inferido pelo DDD 82 — Alagoas) e como funciona a **entrega**.
- [ ] Autorização das clientes que aparecem em "Na vida real".
- [ ] Domínio definitivo (`brand.siteUrl`).
