# CREATIVE DIRECTION — Etapa 2
## Moodboard · Extração de princípios · Storyboard · Wireframes · Fluxo

> Versão 1.0. Entregável da Etapa 2. **Requer aprovação antes de qualquer código.**

---

## 0. Nota sobre a referência (transparência)

A análise ao vivo de `landonorris.com` **não foi possível neste ambiente**: o proxy de rede
bloqueou o domínio (`EGRESS_BLOCKED`). A extração abaixo foi construída a partir (a) dos
atributos que o próprio briefing descreve dos primeiros 15–30s e (b) do repertório do estúdio
sobre esse gênero de abertura cinematográfica (Active Theory / Resn / Locomotive).

Nenhum elemento visual da referência é reproduzido — apenas princípios. Se você quiser,
faça uma passada de validação com a referência aberta e nos diga o que ajustar antes da Etapa 3.

---

## 1. Extração de princípios (o que roubamos — e o que não)

| Princípio observado | Como reinterpretamos | O que fica proibido |
|---|---|---|
| **Entrada cinematográfica** — o site "abre", não "carrega" | Loader de 1px de luz que se expande e dissolve no canvas | Barra de progresso com % , spinner |
| **Objeto central como narrador** | Busto humano abstrato em partículas — presença, não retrato | Capacete, objeto de marca, produto |
| **Profundidade real** | DOF sutil, escala de partículas por distância, parallax de 3 camadas | Sombra falsa, drop-shadow decorativa |
| **Iluminação dinâmica** | Uma key light quente + rim de acento que reage ao cursor | Luz colorida múltipla, neon |
| **Ritmo lento e confiante** | Durações 0.8–1.4s, easeOutExpo, zero bounce | Snap, bounce, micro-delays nervosos |
| **Espaço negativo dominante** | ≥40% da tela vazia em toda cena | Composição preenchida |
| **Transição entre cenas como corte de cinema** | Cross-fade + mudança de matéria visual, nunca slide | Slide horizontal genérico |
| **Microinterações discretas** | Magnetismo ≤8px, cursor de 2 estados | Efeito que rouba atenção do texto |
| **"Estou entrando em algo"** | A primeira ação do usuário é o CTA "Iniciar jornada" | Autoplay que empurra o usuário |

**Diferença essencial de tom:** a referência vende **velocidade e adrenalina**.
Nós entregamos o oposto emocional com o mesmo vocabulário técnico: **desaceleração, respiração, permanência**.
Mesma gramática cinematográfica, verbo invertido.

---

## 2. Moodboard textual

### 2.1 Palavras-âncora
respiração · sopro · vidro fosco · pó de luz · seda em câmera lenta · maré ·
eco · sonar · linha do horizonte à noite · brasa · sala escura com uma janela

### 2.2 Referências de linguagem (não de conteúdo)
- **Luz:** cinematografia de Roger Deakins em interiores noturnos — uma fonte, muita sombra, nada plano.
- **Matéria:** Ryoji Ikeda (rigor de dados) cruzado com Rafael Lozano-Hemmer (presença humana em partículas).
- **Tecido:** ensaios de tecido em câmera lenta / esculturas têxteis de Ernesto Neto — peso e maciez, sem doçura.
- **Cor:** brasa vista de longe no escuro. O laranja é temperatura, não cor de marca berrante.
- **Tipografia:** editorial suíço contemporâneo, escala grande, tracking negativo, muito ar.
- **Som (opcional, off por padrão):** silêncio com um drone quase inaudível; sempre com controle explícito.

### 2.3 Texturas e materiais
Partícula (pó suspenso) · vidro fosco com refração leve · seda sem brilho especular ·
halo volumétrico de baixa intensidade · grão de filme a 3% · aresta de 1px em `--hairline`.

### 2.4 Anti-moodboard (rejeitado explicitamente)
Sofá · consultório · folhas · árvores · cérebro azul · mãos dadas · café · sorrisos para a câmera ·
ilustração corporativa · gradiente roxo-azul de startup · frase motivacional sobre foto ·
ícone de coração · mandala · aquarela.

---

## 3. Storyboard — 8 cenas

Legenda: **[V]** visual · **[M]** movimento · **[C]** copy · **[I]** interação · **[R]** reduced-motion

---

### CENA 1 — HERO · "Presença"

> **Revisão pós-implementação.** O busto de partículas foi substituído por um
> **cérebro** em partículas, a pedido do cliente. O briefing veta "cérebro azul
> girando" — então a peça foi construída negando cada elemento desse clichê:
> não é azul (branco quente + brasa), não gira (o eixo é fixo; o movimento é
> de superfície e de luz), não é sólido (casca fina, opacidade 0.72 em blending
> aditivo) e não é ilustrativo (nenhum contorno, nenhuma "rede neural"). Ocupa o
> fundo da cena e passa por trás do texto, em vez de posar como retrato.

- **[V]** Preto absoluto. À direita do centro, um cérebro em perfil composto por 42–72k partículas concentradas nos sulcos — as dobras se desenham como linhas de luz. Key light quente vinda de cima-frente; rim de acento nas cristas. Vinheta forte. Grão 3%.
- **[M]** Loader (linha de luz) → canvas entra em `scale 1.08→1` → partículas se formam da dispersão (2.4s) → headline em clip-path (stagger 90ms) → sub → CTA. Em loop, três movimentos somados: deriva tangencial contínua (cada partícula com fase própria), respiração de 4s a 2.2%, e uma onda lenta de luz atravessando a forma de trás para a frente.
- **[C]** *A mudança acontece em movimento.* / Sub / **Iniciar jornada** / assinatura "Júlia Beatriz · Psicóloga Clínica · CRP 15/8791".
- **[I]** Parallax de cursor ±2.2° (lerp 0.045). CTA magnético. Scroll hint discreto, some ao primeiro scroll.
- **[R]** Frame estático da formação concluída + texto. Sem loop — verificado: dois frames consecutivos são byte-a-byte idênticos.

> **Regra descoberta na implementação:** a amplitude da deriva precisa ficar
> **abaixo da espessura da casca** (0.016 contra 0.02). Acima disso o movimento
> apaga os sulcos e a forma vira névoa. Por isso o movimento é carregado
> sobretudo pela luz — cintilação por partícula e a onda — e não pelo
> deslocamento. Vale para todas as cenas com estrutura fina.

---

### CENA 2 — ANSIEDADE · "Sincronizar"
- **[V]** Fundo preto. 14 linhas luminosas horizontais atravessam a tela, com espessura variável e um único traço em `--accent`. No início: fora de fase, ruidosas, trêmulas. No fim: um feixe alinhado, calmo, que recua para 25% de opacidade.
- **[M]** Scrub em trilho de 250svh: caos (0–0.35) → desaceleração (0.35–0.70) → sincronia (0.70–0.85) → copy (0.85–1.0).
- **[C]** *Ansiedade* / **Nem todo ruído precisa virar alarme.** / parágrafo.
- **[I]** O usuário controla o tempo. Nada avança sozinho. Sem flash; luminância limitada.
- **[R]** Linhas no estado final, estáticas, com o texto já visível.

---

### CENA 3 — AUTOESTIMA · "Reencontrar"
- **[V]** Um painel translúcido vertical (proporção 3:4) flutua ligeiramente fora do centro. Atrás dele, o texto da cena — parcialmente refratado, sempre legível fora da área do painel.
- **[M]** Refração, blur físico e dispersão cromática (≤1.5px) crescem com a proximidade do cursor. Parado por 700ms, tudo retorna ao equilíbrio em 1.4s.
- **[C]** *Autoestima* / **A imagem que você tem de si também é aprendida.** / parágrafo.
- **[I]** Desktop: cursor. Touch: a velocidade do scroll alimenta a distorção.
- **[R]** Painel em repouso, sem distorção.

---

### CENA 4 — FLEXIBILIDADE PSICOLÓGICA · "Dobrar sem romper"
- **[V]** Uma fita/tecido contínuo atravessa a tela na diagonal. Superfície fosca, luz rasante do topo, fresnel de acento nas dobras. Instalação artística: o objeto é o protagonista, o texto é legenda.
- **[M]** Scrub em 300svh: plana → torção (ruído curl) → absorção → continuidade. Amortecimento crítico, sem oscilação residual. A malha **nunca** rompe — é a mensagem.
- **[C]** *Flexibilidade psicológica* / **Dobrar não é romper.** / parágrafo.
- **[I]** Leve resposta de rotação ao cursor (±2°), com lerp lento.
- **[R]** Fita no estado torcido-resolvido, estática.

---

### CENA 5 — ACEITAÇÃO · "Permanecer"
- **[V]** Centro absoluto. Uma esfera luminosa de superfície difusa, com halo suave. Máximo de espaço negativo do site inteiro. Texto pequeno, muito abaixo.
- **[M]** Pulso de 4s (1.6s expande · 0.4s sustenta · 2.0s retrai), escala 1→1.045, halo com 180ms de atraso. Independente do scroll.
- **[C]** *Aceitação* / **Aceitar não é desistir.** / parágrafo. **Nenhuma instrução de respiração.**
- **[I]** Praticamente nenhuma. Esta cena não pede nada do usuário — esse é o ponto.
- **[R]** Esfera parada, com halo estático.

---

### CENA 6 — CREDIBILIDADE · "Sustentar"
- **[V]** Quatro cards de vidro discretíssimo sobre o preto, em grade 2×2 (desktop) / 1 coluna (mobile). Sem WebGL pesado: apenas grão, vinheta e um spotlight que segue o cursor.
- **[M]** Entrada `FadeUp` com stagger 110ms. Hover: elevação 4px, borda vira acento, spotlight radial.
- **[C]** *Sobre* / **Ciência aplicada com cuidado.** / 4 cards: Júlia Beatriz · CRP 15/8791 · PUCRS · Atuação.
- **[I]** Hover por card. Foco por teclado com o mesmo tratamento visual.
- **[R]** Cards estáticos, sem spotlight.

---

### CENA 7 — PROCESSO TERAPÊUTICO · "Atravessar"
- **[V]** Quatro etapas, cada uma ocupando ~85svh dentro de um trecho pinado. Um fio de luz vertical em `--accent` cresce continuamente, ligando as etapas — continuidade é a mensagem. Numeração em mono (01–04).
- **[M]** Pin + scrub 0.8. Cross-fade `cine` entre etapas. O fio nunca reinicia nem quebra.
- **[C]** 01 Primeiro contato · 02 Compreensão · 03 Estratégias · 04 Evolução (textos no PRD §6).
- **[I]** Marcadores clicáveis; teclado pula etapa a etapa.
- **[R]** As 4 etapas empilhadas verticalmente, sem pin, com o fio desenhado estaticamente.

---

### CENA 8 — CTA FINAL · "Começar"
- **[V]** Escuro quase total. Uma linha de luz horizontal se abre no centro e ilumina de baixo a headline. Botão primário em `--accent`, único elemento saturado da tela.
- **[M]** Linha 1px → 60vw (`cine`) → headline em clip-path → botão com halo respirando (4s, amplitude 6%).
- **[C]** **Talvez este seja apenas o começo.** / Sub / **Agendar uma conversa** / rodapé com CRP, contato, privacidade.
- **[I]** Botão magnético, halo no hover, foco visível robusto. Destino: WhatsApp/e-mail com mensagem neutra pré-preenchida.
- **[R]** Tudo visível, sem abertura de luz, sem halo pulsante.

---

## 4. Wireframes (ASCII)

### 4.1 Desktop — Cena 1 (Hero)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  JÚLIA BEATRIZ · CRP 15/8791                        sobre  processo  [agendar]│ ← navbar ~invisível
│                                                                              │
│                                                                              │
│                                        ░░▒▒▓▓████▓▓▒▒░░                      │
│   A MUDANÇA                          ░▒▓██████████████▓▒░                   │
│   ACONTECE EM                       ░▒▓███ busto de ████▓▒░                 │
│   MOVIMENTO.                        ░▒▓███ partículas ███▓▒░                │  ▪ ← trilho
│                                      ░▒▓██████████████▓▒░                   │  ·   de
│   Um espaço para compreender          ░░▒▒▓▓██████▓▓▒▒░░                    │  ·  jornada
│   sua mente com ciência,                    ░░▒▒▒▒░░                        │  ·
│   acolhimento e propósito.                                                   │  ·
│                                                                              │  ·
│   ( Iniciar jornada → )                                                      │  ·
│                                                                              │
│   ↓ role                                                    Psicóloga Clínica│
└──────────────────────────────────────────────────────────────────────────────┘
   cols 1 ── 5 : texto            cols 6 ── 12 : objeto WebGL
```

### 4.2 Desktop — Cena 2 (Ansiedade), três momentos do scrub
```
progress 0.15 (caos)          progress 0.55 (desacelera)      progress 0.90 (sincronia + copy)
┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
│  ~~~~ ─╱╲─ ~~~~~~      │    │  ~~─────~~─────         │    │ ────────────────────── │
│ ─╲╱─ ~~~~ ─╱╲╱╲─ ~~    │    │ ────~~──────~~──        │    │ ══════════════════════ │ ← accent
│ ~~~ ─╱╲─ ~~~~ ╱╲ ~~~   │    │ ──~~────────~~─         │    │ ────────────────────── │
│  ─╱╲╱╲─ ~~~ ─╲╱─       │    │ ───────~~───────        │    │                        │
│ ~~~~ ╱╲ ~~~~~~ ─╱╲─    │    │ ──~~──────────          │    │  ANSIEDADE             │
│                        │    │                         │    │  Nem todo ruído        │
│                        │    │                         │    │  precisa virar alarme. │
│                        │    │                         │    │  ─────────────────     │
│                        │    │                         │    │  parágrafo (62ch)      │
└────────────────────────┘    └────────────────────────┘    └────────────────────────┘
```

### 4.3 Desktop — Cena 3 (Autoestima)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                        ╔══════════════════════╗                              │
│   AUTOESTIMA           ║ ░░░░░░░░░░░░░░░░░░░░ ║  ← painel translúcido        │
│                        ║ ░░ refração + blur ░ ║     (segue o cursor com lag) │
│   A imagem que você    ║ ░░ dispersão ≤1.5px ░║                              │
│   tem de si também     ║ ░░░░░░░░░░░░░░░░░░░░ ║                              │
│   é aprendida.         ║ ░░░░░░░░░░░░░░░░░░░░ ║                              │
│                        ╚══════════════════════╝                              │
│   parágrafo (62ch)                                                           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Desktop — Cena 4 (Flexibilidade)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                              ╱▓▓▓▓▓╲                         │
│                                       ╱▓▓▓▓▓╱       ╲▓▓▓╲                    │
│                              ╱▓▓▓▓▓▓▓╱                   ╲▓▓▓▓╲              │
│                     ╱▓▓▓▓▓▓▓╱          fita / tecido           ╲▓▓▓▓╲        │
│              ▓▓▓▓▓▓╱                  (dobra, torce,                ╲▓▓▓     │
│                                        nunca rompe)                          │
│   FLEXIBILIDADE PSICOLÓGICA                                                  │
│   Dobrar não é romper.                                                       │
│   parágrafo (62ch)                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Desktop — Cena 5 (Aceitação)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                                                              │
│                                   ░▒▓███▓▒░                                  │
│                                  ▒▓███████▓▒       ← esfera, pulso 4s        │
│                                   ░▒▓███▓▒░                                  │
│                                                                              │
│                                   ACEITAÇÃO                                  │
│                             Aceitar não é desistir.                          │
│                        parágrafo curto, centralizado, 52ch                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
        (máximo de espaço negativo do site — nada mais entra nesta tela)
```

### 4.6 Desktop — Cena 6 (Credibilidade)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│   SOBRE                                                                      │
│   Ciência aplicada com cuidado.                                              │
│                                                                              │
│   ┌────────────────────────────┐   ┌────────────────────────────┐            │
│   │ 01                         │   │ 02                         │            │
│   │ Júlia Beatriz              │   │ CRP 15/8791                │            │
│   │ Psicóloga clínica...       │   │ Registro ativo no CRP.     │            │
│   └────────────────────────────┘   └────────────────────────────┘            │
│   ┌────────────────────────────┐   ┌────────────────────────────┐            │
│   │ 03                         │   │ 04                         │            │
│   │ PUCRS                      │   │ Atuação                    │            │
│   │ Pós-graduanda em TCC.      │   │ Ansiedade · Autoestima ·   │            │
│   └────────────────────────────┘   └────────────────────────────┘            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.7 Desktop — Cena 7 (Processo, seção pinada)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  PROCESSO                                                                    │
│                                                                              │
│   │                                                                          │
│   ●  01 ── PRIMEIRO CONTATO                                                  │
│   │        Uma conversa inicial para entender o que te trouxe até aqui.      │
│   │                                                                          │
│   ○  02 ── COMPREENSÃO            ← etapa ativa muda com o scrub;            │
│   │                                  o fio de luz nunca reinicia             │
│   ○  03 ── ESTRATÉGIAS                                                       │
│   │                                                                          │
│   ○  04 ── EVOLUÇÃO                                                          │
│   │                                                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.8 Desktop — Cena 8 (CTA final)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                    ────────────────────────────────────                      │ ← luz que se abre
│                                                                              │
│                     TALVEZ ESTE SEJA APENAS O COMEÇO.                        │
│                                                                              │
│              Se fez sentido até aqui, o próximo passo é simples.             │
│                                                                              │
│                        ( Agendar uma conversa → )                            │
│                                                                              │
│  Júlia Beatriz · CRP 15/8791        contato        privacidade      © 2026   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.9 Mobile (375px) — Hero e Cena 6
```
┌─────────────────────┐        ┌─────────────────────┐
│ JB · CRP    [agendar]│        │ SOBRE               │
│                     │        │ Ciência aplicada    │
│    ░▒▓█████▓▒░      │        │ com cuidado.        │
│   ▒▓█ busto █▓▒     │        │                     │
│    ░▒▓█████▓▒░      │        │ ┌─────────────────┐ │
│                     │        │ │ 01 Júlia Beatriz│ │
│ A MUDANÇA           │        │ └─────────────────┘ │
│ ACONTECE EM         │        │ ┌─────────────────┐ │
│ MOVIMENTO.          │        │ │ 02 CRP 15/8791  │ │
│                     │        │ └─────────────────┘ │
│ Um espaço para      │        │ ┌─────────────────┐ │
│ compreender sua     │        │ │ 03 PUCRS        │ │
│ mente com ciência.  │        │ └─────────────────┘ │
│                     │        │ ┌─────────────────┐ │
│ ( Iniciar jornada ) │        │ │ 04 Atuação      │ │
│         ↓           │        │ └─────────────────┘ │
└─────────────────────┘        └─────────────────────┘
  objeto acima do texto          1 coluna, sem hover
  (60vh canvas / 40vh copy)      → estados por toque
```

**Adaptações mobile obrigatórias:** objeto WebGL acima do texto no Hero; contagem de partículas por tier;
sem cursor customizado; interações de mouse substituídas por scroll-velocity (Cena 3) e giroscópio **desativado por padrão**;
Cena 7 sem pin (empilhamento com fio contínuo); tipografia display reduzida para `clamp` mínimo de 3.25rem.

---

## 5. Fluxo de navegação

```
                    ┌─────────────────────────┐
                    │  Entrada (loader ~1s)   │
                    └───────────┬─────────────┘
                                ▼
   ┌──────────────────── CENA 1 · HERO ────────────────────┐
   │  [Iniciar jornada] ──► scroll suave até Cena 2         │
   └───────────────────────────┬────────────────────────────┘
                               ▼   (scroll contínuo, Lenis)
      Cena 2 ► Cena 3 ► Cena 4 ► Cena 5 ► Cena 6 ► Cena 7 ► Cena 8
        │        │        │        │        │        │        │
        └────────┴────────┴────────┴────────┴────────┴────────┘
                               │
                 trilho lateral de jornada (8 marcadores, clicáveis)
                               │
   NAVBAR (persistente): [sobre → C6]  [processo → C7]  [AGENDAR → C8 / ação]
                               │
                               ▼
                    ┌─────────────────────────┐
                    │ CTA: WhatsApp / e-mail  │  (abre em nova aba, rel=noopener)
                    └─────────────────────────┘

   Rotas: /                (experiência completa)
          /privacidade     (LGPD, layout sóbrio, sem WebGL)

   Atalhos de teclado: Tab (foco) · Home/End · ↑/↓ e PgUp/PgDn (scroll nativo preservado)
   Skip-links: "Pular para o conteúdo" · "Ir direto para agendar"
```

**Regra de ouro do fluxo:** de qualquer ponto do site, agendar está a **no máximo 2 interações**
(navbar → CTA). A narrativa convida; nunca aprisiona.

---

## 6. O que precisa de aprovação agora

1. Conceito **"Mind in Motion"** e o arco emocional das 8 cenas.
2. **Copy** de todas as cenas (PRD §6) — em especial os textos institucionais da Cena 6/7,
   que precisam da validação da própria psicóloga.
3. Metáforas visuais: busto de partículas · linhas · painel · fita · esfera.
4. Paleta e tipografia (STYLE_GUIDE §2 e §3).
5. Layout dos wireframes acima, desktop e mobile.
6. As 5 pendências da cliente (ARCHITECTURE §10) — o CTA depende do item 1.

Com o "ok", seguimos para a **Etapa 3: apenas o Hero**, com qualidade final, e paramos de novo.
