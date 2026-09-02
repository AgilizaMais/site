# ANIMATION SYSTEM — "Mind in Motion"

> Sistema de movimento. Versão 1.0.
> Princípio: **nenhuma animação existe por si.** Toda animação carrega significado narrativo.

---

## 1. Leis do movimento

1. **Lentidão deliberada.** A duração base é longa (0.8–1.4s). Nada "salta".
2. **Sem bounce.** Nenhum overshoot elástico. A marca não brinca.
3. **A imagem precede o texto.** Reveal de copy sempre 200–400ms *depois* que a cena visual estabiliza.
4. **Uma coisa por vez.** No máximo 2 propriedades animadas simultâneas por elemento.
5. **O scroll é o tempo.** O usuário é o projecionista; nada avança sozinho (exceto respiração e pulso).
6. **Interrupção é permitida.** Toda timeline é reversível e não bloqueia o scroll.
7. **60 FPS ou não existe.** Se não cabe no frame budget, corta-se a ideia, não o desempenho.

---

## 2. Tokens de duração e easing

### Durações (ms)
| Token | Valor | Uso |
|---|---|---|
| `micro` | 120 | click, active |
| `fast` | 240 | hover, cursor |
| `base` | 480 | UI, navbar, cards |
| `slow` | 800 | reveal de texto, entrada de cena |
| `cine` | 1400 | transições de cena, fades cinematográficos |
| `breath` | 4000 | respiração / pulso (loop) |

### Easings (custom, definidos uma vez em `lib/motion/easings.ts`)
| Nome | cubic-bezier | Uso |
|---|---|---|
| `easeOutExpo` | `0.16, 1, 0.3, 1` | reveals, entradas — o padrão do site |
| `easeInOutCine` | `0.65, 0, 0.35, 1` | transições de cena |
| `easeOutSoft` | `0.25, 1, 0.5, 1` | hover, microinterações |
| `easeInQuiet` | `0.55, 0, 1, 0.45` | saídas, fade-out |
| `breathe` | `sine.inOut` (GSAP) | loops respiratórios |

**Proibidos:** `back.out`, `elastic`, `bounce`, `linear` (exceto scrub e loops de shader).

### Stagger
| Contexto | Valor |
|---|---|
| Linhas de headline (clip-path) | 90ms |
| Palavras (quando usado) | 35ms |
| Cards | 110ms, `from: "start"` |
| Itens de lista | 70ms |

---

## 3. Padrões de reveal

### `RevealLines` — headline
Cada linha em um wrapper com `overflow: hidden`; a linha entra com
`clip-path: inset(0 0 100% 0) → inset(0 0 0% 0)` + `translateY(0.35em → 0)`, `slow` / `easeOutExpo`, stagger 90ms.
Nunca animar `opacity` isolada em headline (perde peso tipográfico).

### `FadeUp` — corpo
`opacity 0→1` + `translateY 16px→0`, `slow`, `easeOutExpo`, delay 200ms após a headline.

### `MaskWipe` — blocos/imagens
`clip-path` retangular com direção coerente com a luz da cena.

### `DepthIn` — elementos com profundidade
`scale 1.04→1` + `opacity 0→1` + `blur 8px→0`, `cine`. Usado no máximo 2× no site inteiro.

**Todo reveal dispara em `ScrollTrigger` com `start: "top 72%"`, `once: true`.**

---

## 4. Arquitetura técnica de motion

```
lib/motion/
  easings.ts        // curvas + registro GSAP CustomEase
  durations.ts      // tokens
  useLenis.ts       // provider de smooth scroll (singleton)
  useGsapContext.ts // gsap.context com cleanup no unmount
  useScrollScene.ts // helper: cria ScrollTrigger tipado por cena
  reducedMotion.ts  // matchMedia + override manual (localStorage)
  raf.ts            // um único RAF global: Lenis + GSAP ticker + R3F
```

### Regras de integração
- **Um único RAF.** `lenis.raf` é dirigido pelo `gsap.ticker`; `gsap.ticker.lagSmoothing(0)`.
  R3F usa `frameloop="demand"` onde possível e `"always"` só na cena visível.
- **ScrollTrigger + Lenis:** `ScrollTrigger.scrollerProxy` configurado uma vez no provider.
- **Cleanup obrigatório:** todo componente animado usa `gsap.context()` e `ctx.revert()` no unmount.
- **Nada de `useEffect` sem dependência de escopo.** Timelines vivem em `useLayoutEffect` + context.
- **Framer Motion** é usado só para UI declarativa (navbar, cursor, botões, presença/exit).
  **GSAP + ScrollTrigger** para tudo ligado a scroll e para timelines de cena. Sem sobreposição de responsabilidades.

---

## 5. Coreografia por cena

### Cena 1 — Hero (entrada) — *implementado*
```
t=0.00  loader: linha de luz 1px expande do centro (0.7s, outExpo)
t=0.70  loader dissolve (0.6s, cine); canvas entra opacity 0→1 + scale 1.06→1 (1.4s, cine)
t=0.85  partículas: dispersão → formação do busto (2.2s, easeOutQuart no shader,
        com atraso por partícula de até 0.45 — cada uma chega no seu tempo)
t=1.05  headline RevealLines (clip-path, stagger 90ms)
t=1.35  subheadline FadeUp
t=1.55  CTA: scale 0.96→1
t=1.80  hint de scroll + assinatura
loop    três movimentos somados, em escalas de tempo diferentes:
        · deriva tangencial contínua (campo de ruído; fase própria por partícula)
        · respiração global, amplitude 2.2% em ciclo de 4s
        · onda de luz atravessando a forma, de trás para a frente
        + parallax de cursor ±2.2° (lerp 0.045)
```
Entrada percebida: **~2,4s**, com a headline pintada em ~1,3s.

> **Por que mais rápido do que o previsto originalmente (1.9s para a headline):**
> a headline é o elemento de LCP. Atrasá-la até 1.9s empurrava o LCP para perto
> de 2.5s. A compressão preserva a ordem narrativa — a imagem ainda começa antes
> do texto — sem pagar a métrica. O ritmo continua lento; o *início* é que chegou antes.

Skip: qualquer scroll, clique ou tecla durante a entrada avança a timeline para o fim
(inclusive a formação das partículas, via `lib/motion/introBus.ts`).

### Cena 2 — Ansiedade (scrub)
Trilho de 250svh. `scrub: 1` (suavizado).
```
progress 0.00–0.35  linhas caóticas: ruído alto, frequências dessincronizadas, jitter
progress 0.35–0.70  desaceleração: amplitude e ruído caem, frequências convergem
progress 0.70–0.85  sincronização: linhas alinham em feixe único; um traço vira accent
progress 0.85–1.00  copy entra (RevealLines + FadeUp); linhas recuam para o fundo a 25% de opacidade
```
Nenhum flash. Variação de luminância limitada a 30% por segundo (segurança fotossensível).

### Cena 3 — Autoestima (pointer-driven)
Painel translúcido fixo. `uMouse` com lerp 0.08.
- Refração e blur físico proporcionais à distância do cursor; dispersão cromática máx. 1.5px.
- Ao parar o cursor por 700ms: retorno ao equilíbrio em `cine` / `easeInQuiet`.
- **Touch:** o painel responde à inclinação do scroll (velocidade → distorção) em vez do cursor.

### Cena 4 — Flexibilidade (scrub + física)
Trilho de 300svh. Fita com deformação por ruído curl.
```
0.00–0.30  fita plana, luz rasante
0.30–0.60  torção: rotação no eixo Y + dobra (o shader nunca rompe a malha)
0.60–0.85  a fita absorve o movimento e retoma continuidade
0.85–1.00  copy entra
```
Amortecimento crítico (sem oscilação residual): `damping 0.85`.

### Cena 5 — Aceitação (autônomo)
Esfera pulsa em ciclo de **4s** (1.6s expansão · 0.4s sustentação · 2.0s retração), `breathe`.
Escala 1 → 1.045. Halo acompanha com 180ms de atraso. Nunca sincronizar com scroll.
Copy já presente, sem animação de entrada agressiva. Esta cena tem **o menor volume de movimento do site**.

### Cena 6 — Credibilidade
Cards com stagger 110ms, `FadeUp`. Hover: spotlight que segue o cursor (CSS custom property atualizada por rAF throttled).

### Cena 7 — Processo
Pin horizontal-in-vertical: 4 etapas, `scrub: 0.8`, cada etapa ~85svh.
Linha de progresso `--accent` cresce continuamente entre as etapas (continuidade = mensagem).
Cross-fade entre etapas com `cine`, sem slide lateral genérico.

### Cena 8 — CTA final
Luz central se abre (`scaleX` de 1px → 60vw, `cine`), headline em RevealLines, botão com halo respirando (`breath`, amplitude 6%).

---

## 6. Microinterações

| Elemento | Trigger | Resposta |
|---|---|---|
| Botão primário | hover | halo expande, seta +4px, `fast`/`easeOutSoft` |
| Botão primário | pointermove no raio de 80px | magnetismo máx. 8px, spring |
| Link de texto | hover | sublinhado cresce da esquerda, `fast` |
| Card | hover | elevação 4px + spotlight + borda accent |
| Headline | mouse próximo | tracking +0.004em (imperceptível e proposital), `base` |
| Navbar | scroll | opacidade/blur em rampa contínua |
| Cursor | hover interativo | anel 28→48px |
| Indicador de jornada | cena ativa | marcador 1px→4px + cor accent |

Regra: **nenhuma microinteração deslocamento > 8px** e nenhuma dura > 500ms.

---

## 7. Reduced motion

`prefers-reduced-motion: reduce` **ou** toggle manual → estado `reduced`:

- Lenis desativado (scroll nativo).
- Todos os reveals viram `opacity 0→1` em 200ms, sem transform, sem clip-path.
- Cenas WebGL renderizam **um único frame estático** representativo (estado final, esteticamente resolvido) e param o loop.
- Pulso e respiração param.
- Cursor customizado desativado.
- Parallax e magnetismo desativados.
- Pin de scroll (Cena 7) vira empilhamento vertical simples.

O conteúdo é **idêntico** nos dois modos. Nenhuma informação vive apenas na animação.

---

## 8. Performance do motion

- Só animar `transform`, `opacity`, `filter` (com parcimônia) e uniforms de shader.
- `will-change` aplicado apenas durante a animação, removido no complete.
- `ScrollTrigger.config({ ignoreMobileResize: true })`; `invalidateOnRefresh` nas timelines com medidas.
- Nada de `ScrollTrigger` por elemento em listas: um trigger com stagger interno.
- Throttle de `pointermove` para 1 leitura por frame; valores aplicados via lerp no rAF único.
- Orçamento por frame: **≤ 8ms** de JS na main thread durante scroll.
