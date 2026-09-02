# Júlia Beatriz — *Mind in Motion*

Site da psicóloga clínica Júlia Beatriz (CRP 15/8791): uma jornada narrativa em oito cenas,
onde cada conceito clínico é traduzido em matéria visual antes de virar texto.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Three.js + React Three Fiber ·
GSAP + ScrollTrigger · Lenis · Framer Motion (LazyMotion) · GLSL.

## Rodando

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de produção
npm run typecheck
npm run lint

npm run build:static  # gera out/ com index.html para hospedagem comum
```

Para publicar, veja [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Documentação

Os documentos em `docs/` são a fonte da verdade do projeto — leia antes de mexer no código.

| Documento | Conteúdo |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Visão, personas, copy das oito cenas, requisitos, conformidade com o Código de Ética do CFP |
| [`docs/STYLE_GUIDE.md`](docs/STYLE_GUIDE.md) | Paleta, tipografia, grid, componentes |
| [`docs/ANIMATION_SYSTEM.md`](docs/ANIMATION_SYSTEM.md) | Leis de movimento, tokens, coreografia por cena, reduced-motion |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Estrutura, camada WebGL, performance, acessibilidade, fases |
| [`docs/CREATIVE_DIRECTION.md`](docs/CREATIVE_DIRECTION.md) | Moodboard, storyboard, wireframes, fluxo |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Como publicar (estático ou Vercel) |
| [`docs/FONTS.md`](docs/FONTS.md) | Ativação das fontes General Sans e Satoshi |

## Estado

Construção por etapas, uma cena por vez.

- ✅ Fase 0 — fundação (tokens, providers, navbar, cursor, reduced-motion)
- ✅ Fase 1 — **Cena 1: Hero**
- ⬜ Fases 2–8 — Cenas 2 a 8
- ⬜ Fase 9 — polimento global, SEO, LGPD, QA e deploy

A navegação só oferece âncoras de cenas já implementadas
(`implementedScenes` em `lib/content/site.ts`).
