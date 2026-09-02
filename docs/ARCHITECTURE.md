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
    01-hero/                 // Hero.tsx HeroCanvas.tsx HeroScene.tsx HeroParticles.tsx
                             // brainGeometry.ts   (forma e campos de dobras)
                             // brainFilaments.ts  (traçado das curvas)
                             // cloud.worker.ts useBrainCloud.ts
                             // shaders/particles.vert.ts .frag.ts
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
7. **A nuvem de pontos é gerada num Web Worker.** A amostragem do SDF do cérebro
   custa 0,7–1,5s; na main thread isso engasgava a entrada inteira. O worker
   devolve os buffers como transferíveis (sem cópia), e a formação começa assim
   que a nuvem chega — se o worker demorou mais que o atraso previsto, o atraso
   é descontado em vez de somado.
8. **Filamentos traçados, não pontos filtrados.** Amostrar a superfície e
   filtrar por densidade produz poeira que *sugere* dobras. Para obter cordões
   contínuos, as curvas são **seguidas**: para cada semente caminha-se ao longo
   da linha de nível do campo de fase — que é, por construção, a crista de um
   giro — corrigindo a cada passo o desvio na superfície e na fase
   (predictor–corrector). Três armadilhas custaram caro:
   · o gradiente por diferenças centrais precisa ser dividido por `2e`; sem
     isso o passo de Newton sai ~1/(2e) vezes maior e o traçado diverge na
     primeira iteração (para a normal isso é invisível, pois ela é normalizada);
   · a fase salta um período inteiro ao cruzar para o filamento vizinho, e o
     desvio precisa ser envolvido nesse período, senão o corretor tenta desfazer
     o salto;
   · com o passo menor que a célula do hash espacial, um filamento se detecta
     como sobreposição de si mesmo — a célula precisa guardar a identidade do
     filamento, não uma contagem.
9. **O contorno é declarado, não ajustado.** Nenhuma combinação de elipsoides
   produz a silhueta de um cérebro: produz cúpulas e cogumelos. O perfil lateral
   é uma curva fechada explícita no plano (z, y) — polo frontal, margem
   superior, polo occipital, face inferior e lobo temporal — extrudada em
   largura variável. Fissuras de Sylvius, longitudinal e transversa são
   escavadas como cápsulas subtraídas.
10. **Custo da amostragem.** Três otimizações que tiraram a geração de ~4,3s
   para ~2,3s (100k pontos), todas no laço quente: normais calculadas a partir
   da forma **lisa** (seis avaliações do SDF completo por partícula custavam
   mais que todo o resto somado, e as dobras hoje vêm da densidade, não do
   sombreamento); forma base e campo de dobras calculados **uma vez** por
   amostra e repassados ao detalhe; e duas octaves no *domain warp*, que
   desloca coordenadas e não desenha detalhe.
11. **Back-face cull suave, e o contraste vem da luz.** Com blending aditivo não
   há oclusão: a superfície de trás soma sobre a da frente e apaga o padrão de
   dobras. As partículas voltadas para longe da câmera são atenuadas
   (`max(0, dot(n, view))`), com um realce fino na borda da silhueta.
   O valor do campo de dobras viaja com a partícula (`aSeed.z`) e acende as
   cristas enquanto apaga os sulcos — bandas claras e escuras, que é o que o
   olho reconhece como cérebro. Enviesar a *densidade* para os sulcos foi
   tentado antes e desenhava só os vales: a forma sumia.
12. **Aparência independente de DPR.** O `gl_PointSize` era limitado *depois* de
   multiplicar pelo `devicePixelRatio`, então em telas 2x/3x a partícula virava
   um ponto sub-pixel e o conjunto lia como borrão. O limite passou a ser em
   pixels CSS, e o DPR entra depois. O sprite também deixou de ser um gradiente
   até o centro (cada partícula era um pequeno halo, e a soma dos halos era o
   aspecto "brilhoso"): agora é um disco de núcleo sólido com borda fina de
   antisserrilhado.
13. **A deriva precisa ser menor que a espessura da casca.** Com deriva 0.038 e
   casca 0.02, o movimento apagava os sulcos. Movimento passou a ser carregado
   pela luz (cintilação por partícula, onda percorrendo a forma), não pelo
   deslocamento.
14. **Registro de cenas implementadas** (`lib/content/site.ts`): a navegação só oferece
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
| `high` | desktop, `hardwareConcurrency ≥ 8`, sem `saveData` | ~420k* | 2.0 | bloom leve |
| `mid` | default | ~235k* | 1.5 | nenhum |
| `low` | mobile antigo, `deviceMemory ≤ 4`, `saveData` | ~115k* | 1.0 | nenhum |

\* A contagem não é um parâmetro: ela emerge do traçado dos filamentos. O que
o tier controla é o número de sementes, o passo e o comprimento máximo das
curvas (`qualityFor`), e a densidade ainda acompanha a área que o objeto ocupa
na tela — contagem fixa era o que saturava o mobile.
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
