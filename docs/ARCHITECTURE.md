# ARCHITECTURE — "Mind in Motion"

> Arquitetura técnica. Versão 1.0.

---

## 1. Situação atual do repositório

`AgilizaMais/site` hoje contém um starter **Vite + React 18 + TS + Tailwind** (template bolt),
com `src/App.tsx` placeholder. O histórico mostra `CNAME` criado e depois removido (GitHub Pages).

**Decisão:** migrar para **Next.js 15 (App Router)**, conforme stack obrigatória, substituindo o
scaffold Vite. O código atual não tem conteúdo a preservar.

**Premissa de deploy (assumida — confirmar):** Vercel.
Se o destino for GitHub Pages, adotamos `output: 'export'` (todo o site é estático; nenhuma
feature exige runtime de servidor), com `images.unoptimized: true` e `basePath` conforme domínio.
Ambos os caminhos são compatíveis com a implementação descrita aqui.

---

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15.5 · App Router · React 19 · TypeScript 5.7 (strict, `noUncheckedIndexedAccess`) |
| Estilo | Tailwind CSS 3.4 + CSS custom properties (tokens) |
| 3D | Three.js 0.170 + React Three Fiber **9** (drei ainda não instalado — entra quando alguma cena precisar) |
| Shaders | GLSL puro em módulos `.ts` que exportam template strings (sem loader de webpack/turbopack); chunks compartilhados em `lib/gl/` |
| Motion | GSAP 3 + ScrollTrigger (+ CustomEase) · Framer Motion via `LazyMotion`/`domAnimation` (UI) · Lenis |
| Spline | Somente se uma cena exigir asset autoral que não valha reimplementar; carregado lazy e isolado |
| Qualidade | ESLint (flat) · Prettier · TypeScript strict · Vitest (unidade) · Playwright (smoke + a11y) |
| Analytics | Vercel Analytics ou Plausible — sem cookies |

---

## 3. Estrutura de pastas

```
app/
  layout.tsx                 // fonts, metadata, providers, skip-link
  page.tsx                   // composição das 8 cenas
  privacidade/page.tsx
  opengraph-image.tsx
  globals.css                // tokens, reset, utilities

components/
  scenes/
    01-hero/                 // Hero.tsx  HeroCanvas.tsx  particles.vert/.frag  useHeroParticles.ts
    02-anxiety/
    03-selfesteem/
    04-flexibility/
    05-acceptance/
    06-credibility/
    07-process/
    08-cta/
  ui/
    Button.tsx  MagneticButton.tsx  GlassCard.tsx  Navbar.tsx
    Cursor.tsx  JourneyRail.tsx  SkipLink.tsx  MotionToggle.tsx  Footer.tsx
  typography/
    Headline.tsx  RevealLines.tsx  Eyebrow.tsx  Body.tsx
  canvas/
    SceneCanvas.tsx          // wrapper R3F: lazy, in-view, tier, DPR, fallback
    QualityManager.tsx       // tier de dispositivo + degradação adaptativa
    ScreenQuad.tsx  Fallback.tsx

lib/
  motion/                    // (ver ANIMATION_SYSTEM.md §4)
  gl/
    shaderMaterial.ts        // factory tipada de ShaderMaterial
    noise.glsl  fbm.glsl  curl.glsl  dither.glsl   // chunks reutilizáveis
    useUniform.ts  useResponsiveDpr.ts
  hooks/
    useInViewport.ts  useDeviceTier.ts  usePointer.ts  usePrefersReducedMotion.ts
  content/
    scenes.ts                // toda a copy, tipada — fonte única de conteúdo
    meta.ts  jsonld.ts
  utils/

public/
  fonts/  og/  noise.png

docs/                        // PRD, STYLE_GUIDE, ANIMATION_SYSTEM, ARCHITECTURE, CREATIVE_DIRECTION
```

### Decisões de implementação registradas na Fase 1

1. **React 19 + R3F v9.** React 18 com R3F v8 quebra o App Router do Next 15
   (`ReactCurrentBatchConfig` indefinido no prerender). A dupla compatível é R3F 9 + React 19.
2. **O canvas nunca entra no bundle de servidor.** `HeroScene` é carregado por
   `next/dynamic({ ssr: false })`; three + R3F ficam num chunk próprio, fora do first-load.
3. **Uniforms pertencem ao material, não à prop.** O R3F clona o objeto passado em
   `<shaderMaterial uniforms={...}>`, o que faz as tweens do GSAP animarem uma cópia órfã
   (bug silencioso: a cena renderiza, mas nada anima). O material é construído com
   `new THREE.ShaderMaterial({ uniforms })`, que guarda a referência.
4. **`CustomEase.create` exige caminho SVG com comando `C`.** Sem ele a curva é aceita e
   devolve 1 para qualquer entrada — todo easing vira um salto. Formato correto em
   `lib/motion/gsap.ts`.
5. **GLSL ES 1.00 não tem `%` para inteiros.** O dither usa aritmética em float.
6. **`LazyMotion` + `m` no lugar de `motion`.** Reduziu o first-load de 195 KB para
   **175 KB gz** — dentro do orçamento de 180 KB.
7. **Registro de cenas implementadas** (`lib/content/site.ts`): a navegação só oferece
   âncoras que já existem, então a construção por etapas nunca expõe link morto.

### Convenções
- Server Components por padrão; `"use client"` **apenas** em componentes com estado/animação.
- Cada cena exporta `Scene0XSection` (server, com todo o texto em DOM) que embute um `<SceneCanvas>` client.
  → **A copy nunca depende do JS de animação nem do WebGL.**
- Um arquivo = um componente. Shaders sempre em arquivo próprio, nunca em template string inline.
- Nomes de uniforms com prefixo `u` (`uTime`, `uMouse`, `uProgress`, `uDpr`).

---

## 4. Camada WebGL

### `SceneCanvas`
Responsabilidades:
1. **Lazy:** `next/dynamic({ ssr: false })` + `IntersectionObserver` com `rootMargin: 200%` (pré-monta uma tela antes).
2. **Pausa:** `frameloop` vai para `"never"` quando a cena sai do viewport ou a aba perde foco.
3. **DPR:** `dpr={[1, tier === 'high' ? 2 : 1.5]}`, clamp por `devicePixelRatio` real.
4. **Fallback:** sem WebGL, sem GPU aceitável, ou `reduced` → imagem estática (`.webp`, ~40 KB) do frame canônico da cena.
5. **Contexto único por cena**, descartado no unmount (`gl.dispose()` + dispose de geometrias/materiais/texturas).

### Tiers de dispositivo (`useDeviceTier`)
| Tier | Detecção | Partículas (Hero) | DPR máx | Pós-processamento |
|---|---|---|---|---|
| `high` | desktop, `hardwareConcurrency ≥ 8`, sem `saveData` | 120k | 2.0 | bloom leve |
| `mid` | default | 45k | 1.5 | nenhum |
| `low` | mobile antigo, `deviceMemory ≤ 4`, `saveData` | 18k | 1.0 | nenhum |
| `none` | sem WebGL2 / reduced-motion | — | — | fallback estático |

**Degradação adaptativa:** média móvel de FPS em janela de 60 frames; abaixo de 50 FPS por 2s,
cai um tier (uma vez, sem oscilar). Nunca sobe de volta na mesma sessão.

### Regras de shader
- GLSL ES 3.0, precisão `mediump` onde suficiente.
- Ruído: `simplex3d` / `fbm` / `curl` compartilhados em `lib/gl/*.glsl`, incluídos por `#include` no build.
- Partículas: `THREE.Points` com atributos instanciados; posição calculada **no vertex shader** a partir de
  atributos estáticos + `uTime` — nada de atualizar buffers na CPU.
- Bandas de cor eliminadas com dither ordenado (custo desprezível) — essencial num fundo `#09090B`.
- Blending aditivo com `depthWrite: false` para glow; sem transparência ordenada complexa.
- Alvo: **≤ 3 draw calls por cena**, zero alocações por frame.

---

## 5. Renderização, dados e SEO

- Site 100% estático (SSG). Sem banco, sem API, sem formulário que trafegue dado de saúde.
- CTA → `https://wa.me/<numero>?text=<mensagem pré-preenchida neutra>` e/ou `mailto:` (a confirmar com a cliente).
- `metadata` no App Router: title, description, canonical, OG/Twitter, `robots`.
- `opengraph-image.tsx` gerado em build (frame do Hero + nome + CRP).
- **JSON-LD:** `@type: Psychologist` com `name`, `jobTitle`, `identifier` (CRP 15/8791), `areaServed`, `knowsAbout`, `alumniOf` (PUCRS). Sem `aggregateRating` (vedado).
- `sitemap.ts`, `robots.ts`, `lang="pt-BR"`.

---

## 6. Performance

| Alvo | Estratégia |
|---|---|
| LCP < 2,0 s | LCP é a headline do Hero (texto, não canvas). Fonte preloaded; canvas entra depois. |
| CLS < 0,05 | Alturas reservadas (`svh`), sem fonte com fallback de métrica divergente (`size-adjust`). |
| INP < 200 ms | Zero trabalho pesado em handlers; tudo passa pelo rAF único. |
| JS inicial < 180 KB gz | Three/R3F/GSAP em chunks dinâmicos por cena; `modularizeImports` para drei. |
| 60 FPS | Ver §4 e ANIMATION_SYSTEM §8. |

- `next/font/local` com `preload` só para o peso do display.
- Imagens: AVIF/WebP, `sizes` explícitos, `priority` apenas no fallback do Hero.
- Bundle analyzer no CI; **orçamento falha o build** se o first-load JS passar de 200 KB gz.
- `Suspense` por cena com fallback = o próprio frame estático (nunca um spinner).

---

## 7. Acessibilidade

- Landmarks: `header` / `main` / `footer`; cada cena é uma `<section aria-labelledby>`.
- Skip-link para `#conteudo` e para `#agendar`.
- Canvas: `aria-hidden="true"` + descrição textual da metáfora em `.sr-only` na seção.
- Foco visível global (`:focus-visible`, anel accent 2px + offset), nunca removido.
- Ordem de tab = ordem visual; nenhum scroll-jacking que impeça `Tab`/`End`/`Home`.
- `MotionToggle` na navbar e no rodapé, persistido, respeitando o SO por padrão.
- Testes: `axe-core` via Playwright em CI, em cada rota, nos dois modos de movimento.

---

## 8. Testes e CI

```
CI (GitHub Actions)
 ├─ typecheck (tsc --noEmit)
 ├─ lint (eslint + prettier check)
 ├─ unit (vitest: content, utils, easings, tier)
 ├─ build (falha se orçamento de bundle estourar)
 ├─ e2e smoke (Playwright: as 8 cenas renderizam com JS de motion off)
 ├─ a11y (axe: 0 violações críticas/sérias)
 └─ lighthouse-ci (Perf ≥ 95 mobile, A11y = 100, BP ≥ 95, SEO = 100)
```

---

## 9. Fases de implementação

| Fase | Entrega | Gate |
|---|---|---|
| 0 | Migração Next 15, tokens, providers (Lenis/GSAP/reduced-motion), navbar e cursor base | ✅ entregue |
| 1 | **Cena 1 — Hero** completo | ✅ entregue |
| 2 | Cena 2 — Ansiedade | aprovação |
| 3 | Cena 3 — Autoestima | aprovação |
| 4 | Cena 4 — Flexibilidade | aprovação |
| 5 | Cena 5 — Aceitação | aprovação |
| 6 | Cena 6 — Credibilidade | aprovação |
| 7 | Cena 7 — Processo | aprovação |
| 8 | Cena 8 — CTA final | aprovação |
| 9 | Polimento global, SEO, LGPD, QA de dispositivos, deploy | aprovação |

Cada fase termina com: revisão criativa · profiling (FPS/bundle) · checklist de a11y · checklist de ética.

---

## 10. Pendências para a cliente

1. Número de WhatsApp e/ou e-mail oficial para o CTA.
2. Destino de deploy e domínio (Vercel vs. GitHub Pages + CNAME).
3. Existe foto autoral utilizável? (Se não, seguimos sem foto — está previsto.)
4. Atendimento on-line, presencial ou ambos? Cidade/UF a divulgar.
5. Confirmação do texto institucional da Cena 6 pela própria psicóloga (responsabilidade profissional).
