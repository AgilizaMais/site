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
loop    quatro movimentos somados, em escalas de tempo diferentes:
        · deriva LARGA (ruído de baixa frequência) — move regiões inteiras devagar
        · deriva FINA — vida ponto a ponto
        · respiração global, amplitude 3% em ciclo de 4s
        · onda de luz atravessando a forma
        + parallax de cursor ±1.6° (lerp 0.045)

> Só a deriva fina, o olho lê como ruído parado: é a escala larga que faz a
> nuvem parecer respirar. E a onda é o movimento que se enxerga de longe, sem
> depender de olhar partícula por partícula.
```
Entrada percebida: **~2,4s**, com a headline pintada em ~1,3s.

> **Por que mais rápido do que o previsto originalmente (1.9s para a headline):**
> a headline é o elemento de LCP. Atrasá-la até 1.9s empurrava o LCP para perto
> de 2.5s. A compressão preserva a ordem narrativa — a imagem ainda começa antes
> do texto — sem pagar a métrica. O ritmo continua lento; o *início* é que chegou antes.

Skip: qualquer scroll, clique ou tecla durante a entrada avança a timeline para o fim
(inclusive a formação das partículas, via `lib/motion/introBus.ts`).

### Cena 2 — Ansiedade (scrub) — *implementado*
Trilho de 380svh, objeto preso por `position: sticky`. `scrub: 1`.

**Duas curvas, não uma.** Desaceleração e sincronização são etapas distintas —
primeiro o movimento perde energia, só depois as linhas se alinham. Com uma
curva única as duas coisas acontecem juntas e o meio do caminho desaparece.

```
decel = smoothstep(0.26, 0.78, p)   → amplitude, velocidade e tremor caem
sync  = smoothstep(0.56, 0.92, p)   → dispersão, frequência e fase convergem

progress 0.00–0.26  caos: 14 linhas dessincronizadas, com tremor de alta frequência
progress 0.26–0.78  desaceleração
progress 0.56–0.92  sincronização: feixe único, assentado abaixo do centro
progress 0.90–1.00  copy entra; o feixe recua para 58% do brilho
```

As faixas se sobrepõem e são longas de propósito: a travessia É a cena. Em
250svh com faixas curtas, o caos virava equilíbrio rápido demais para o
visitante sentir o percurso.

O valor lido pelo shader ainda passa por um `damp` de 6/s: a roda do mouse
entrega saltos, e um pulo na sincronização diria o oposto do que a cena narra.

Nenhum flash. Nenhum termo pisca; a luminância de cada linha varia devagar e o
somatório é estável ao longo do scrub (segurança fotossensível).

**Nenhuma linha toca a borda.** Duas defesas, porque as causas são diferentes:
um limitador suave (`w / sqrt(1 + w²/limite²)`) impede que a excursão alcance o
topo ou a base do quadro — um clamp duro achataria a onda e entregaria o
limite; e uma vinheta nos quatro lados dissolve o traço em vez de cortá-lo. A
vertical importa enquanto a seção entra em cena: ali a borda do quadro está no
meio da tela, e sem ela a linha termina seca no vazio.

**Retrato tem composição própria.** Com o domínio horizontal multiplicado pelo
aspecto, cada linha mostraria meia onda e o campo viraria três curvas soltas.
Em retrato o domínio é mantido próximo do quadrado, a dispersão vertical se
abre e a amplitude cai pela metade.

### Cena 3 — Autoestima (pointer-driven) — *implementado*
Painel translúcido sobre um campo de luz estriado. O ponteiro é suavizado com
`damp(5)`: o painel acompanha, não persegue — o atraso é o que dá massa ao vidro.

**Amortecimento assimétrico.** A distorção sobe com `damp(7)` e desce com
`damp(1.7)`: responde na hora e se desfaz devagar. Simétrico ficaria nervoso, e
a cena fala de retorno ao equilíbrio, não de reflexo.

- 700ms de cursor parado e a imagem começa a voltar ao lugar.
- Deslocamento com curvatura de lente (cresce em direção às bordas), dispersão
  cromática abaixo de 1.5px na escala da tela, e blur por amostragem cruzada.
- **Touch:** sem cursor, quem perturba a imagem é a velocidade do próprio
  scroll. A leitura é a mesma — o movimento distorce, a pausa devolve.
- O retângulo do painel é medido no DOM e enviado ao shader: o layout é a fonte
  da verdade, então o vidro nunca sai do lugar em nenhum viewport.

> **O campo precisa ter estrutura fina.** É o deslocamento das estriações que
> torna a refração visível. Um campo liso atravessa o vidro sem revelar nada e o
> painel vira uma placa colorida — foi o que aconteceu nas duas primeiras
> tentativas.

### Cena 4 — Flexibilidade (scrub) — *implementado*
Trilho de 300svh, objeto preso por `sticky`, `data-snap="end"`. O ScrollTrigger
escreve `progress.current.value`; o componente amortece com `damp(5)` antes de
passar ao shader — a roda do mouse entrega saltos, e um salto aqui leria como
ruptura, o oposto do que a cena diz.

```
0.00–0.18  torção de repouso: a fita já entra com forma
0.18–0.66  a dobra cresce e a torção entra
0.60–0.94  a agitação é absorvida; a forma assumida permanece
0.68–0.82  copy entra
```

**A malha é um plano; toda a forma vem do vertex shader.** A construção é a de
um tubo achatado: uma curva-guia dá o eixo, e uma seção transversal gira em
torno dele. Torcer é girar a seção; dobrar é curvar a guia. Como a superfície é
sempre gerada a partir de uma curva contínua, ela **não tem como se partir** —
que é exatamente o que a cena afirma. Não há simulação nem amortecimento de
mola: o que existe é uma família de formas contínuas indexada pelo progresso.

Regras descobertas aqui:

- **A seção em repouso é a normal do quadro, não o binormal.** Começar pelo
  binormal apresenta a fita de perfil — e uma fita de perfil é uma linha.
- **A torção é função de `t` normalizado, nunca da coordenada de mundo.** Assim
  o número de voltas é o mesmo em qualquer viewport: numa tela larga a fita
  fica mais longa, não mais retorcida.
- **Uma torção de repouso, sempre presente.** Sem ela a fita entra na cena como
  uma placa chapada de frente para a câmera — larga, clara e sem forma.
- **A troca face/avesso é amortecida perto da rasância.** Um degrau seco em
  `gl_FrontFacing` deixa um risco preto atravessando a fita.
- **A dobra acende em laranja** (fresnel onde a superfície fica de perfil). É o
  único lugar do site onde o acento aparece em área — e sem ele a dobra vira um
  risco escuro.
- **Fill fraca do lado oposto à key.** Existem orientações em que a fita some
  por completo; no retrato, onde só um trecho curto aparece, era justamente
  esse trecho que caía no preto.
- **Retrato tem enquadramento próprio:** fita mais curta, ondulação reduzida na
  mesma proporção (senão sai pelo topo), faixa deslocada para cima (embaixo
  fica o texto), corrida na diagonal e key light mais frontal.
- **No modo reduzido `uTime` não fica em zero:** ali a fita passa por si mesma
  quase no mesmo plano e a interseção abre cunhas escuras no quadro parado.

Contraste medido sob a copy, do início da entrada ao fim do trilho: **pior caso
7.1:1** (`u-veil-right`, o véu espelhado para blocos alinhados à direita).

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

## 5b. Teto de velocidade da rolagem

O site não tem pontos de parada, âncoras nem correção de posição: ele nunca
decide para onde o visitante vai, nem interrompe o gesto dele. A única coisa
que limita é o quanto de embalo um gesto pode acumular.

O Lenis guarda em `targetScroll` para onde o embalo está indo e em
`animatedScroll` onde a página está agora. A diferença — a **dianteira** — é o
que determina a velocidade: quanto mais longe o destino, mais rápido o Lenis
corre até ele. Limitar a dianteira limita a velocidade, e é um ajuste contínuo,
sem descontinuidade nenhuma. Implementação em `lib/motion/useScrollSpeedLimit.ts`.

**Calibração.** Com `duration: 1.1` e a easing exponencial do provider,

```
velocidade de pico ≈ dianteira × 6.31 por segundo
```

(6.31 é a derivada da easing na origem dividida pela duração.) O teto está em
frações da altura da tela, então o pico permitido é `MAX_LEAD × 6.31` telas por
segundo:

| `MAX_LEAD` | Pico | Sensação |
|---|---|---|
| 0.25 | 1.6 telas/s | contido, quase deliberado |
| **0.35** | **2.2 telas/s** | atual |
| 0.50 | 3.2 telas/s | solto |

Para comparar: um clique de roda vale ~100px de dianteira, ou 0.7 tela/s numa
tela de 900px — muito abaixo do teto, e portanto intocado. Rolar para ler não
sente nada. Sem limite, o giro insistente estabiliza perto de 800px de
dianteira na roda (5.5 telas/s) e passa fácil de 2000px no trackpad
(14 telas/s).

**O teto nunca trunca um gesto sozinho.** Ele é sempre no mínimo o delta do
próprio evento: um mouse que manda o scroll em linhas ou em páginas, ou um
trackpad que entrega um delta grande de uma vez, pediu aquela distância num
movimento só. Cortá-la seria o site engolindo a rolagem, que é pior do que ser
rápido. O que o teto impede é o **empilhamento** de gestos.

**Só vale para roda e trackpad.** No toque o Lenis roda com `syncTouch: false`:
o embalo é o do sistema operacional, não passa por ele, e não há dianteira para
limitar. Levar o teto para o celular exigiria `syncTouch: true`, com o Lenis
assumindo a rolagem do dedo inteira — troca de sensação grande, decisão à parte.

> **O que foi tentado antes e removido: pausa nos pontos de leitura.** Cada cena
> marcava onde descansava e o site conduzia até lá — freando o embalo na roda,
> e com `scroll-snap-type: proximity` no toque. Funcionava: o texto da Cena 2
> parava de passar batido. Mas custou a fluidez, que é o ativo principal deste
> site. Um site cinematográfico não pode ter soluços. Ficou o aprendizado de
> que **corrigir posição sempre aparece**, por mais suave que seja a curva —
> o que não aparece é mexer só na velocidade.

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
