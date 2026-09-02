# STYLE GUIDE — "Mind in Motion"

> Direção de arte e sistema visual. Versão 1.0.
> Regra mestra: **contraste alto, densidade baixa**. Se estiver em dúvida, remova.

---

## 1. Princípios de arte

1. **O preto é o palco, não o fundo.** Nada de gradientes decorativos. A luz é que desenha.
2. **Uma fonte de luz por cena.** Direção e temperatura definidas antes de qualquer geometria.
3. **Espaço negativo é conteúdo.** Mínimo de 40% da tela vazia em qualquer cena.
4. **O laranja é assinatura, não paleta.** Máximo ~5% da área visível. Ele aponta, nunca preenche.
5. **Nada é literal.** Se a metáfora precisa de legenda, ela falhou.
6. **Silêncio antes do texto.** A imagem chega primeiro; a copy entra depois, sempre.

---

## 2. Paleta

### Base
| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#09090B` | Fundo absoluto. Nunca clarear. |
| `--surface` | `#18181B` | Cards, painéis, superfícies elevadas. |
| `--surface-2` | `#232327` | Hover de superfície, bordas internas. |
| `--text` | `#FFF8F1` | Texto principal (branco quente). |
| `--muted` | `#A1A1AA` | Texto secundário, labels, metadados. |
| `--accent` | `#F97316` | Assinatura: CTA, foco, um traço de luz por cena. |

### Derivados (uso restrito, gerados a partir dos tokens acima)
| Token | Valor | Uso |
|---|---|---|
| `--accent-soft` | `rgba(249,115,22,0.14)` | Glow, halo, estados de hover. |
| `--accent-line` | `rgba(249,115,22,0.35)` | Bordas ativas, sublinhados. |
| `--hairline` | `rgba(255,248,241,0.08)` | Divisórias de 1px. |
| `--glass` | `rgba(24,24,27,0.55)` | Fundo de vidro (com `backdrop-blur: 16px`). |
| `--glass-edge` | `rgba(255,248,241,0.10)` | Borda superior/esquerda do vidro. |

### Contraste verificado (WCAG 2.2)
| Par | Ratio | Status |
|---|---|---|
| `#FFF8F1` sobre `#09090B` | 18.9:1 | AAA |
| `#A1A1AA` sobre `#09090B` | 8.6:1 | AAA |
| `#F97316` sobre `#09090B` | 6.9:1 | AA (texto normal) / AAA (large) |
| `#09090B` sobre `#F97316` | 6.9:1 | AA — usado no botão primário |
| `#A1A1AA` sobre `#18181B` | 7.2:1 | AAA |

> **Regra:** texto sobre WebGL sempre recebe um véu (`radial-gradient` de `--bg` a 0→70%) atrás,
> garantindo ≥ 7:1 mesmo no frame mais claro da animação. Verificado por captura do frame mais luminoso.

### Temperatura de luz por cena (WebGL)
| Cena | Key light | Rim / accent | Sensação |
|---|---|---|---|
| 1 Hero | `#FFF8F1` 8% frontal-alta | `#F97316` 12% lateral direita | presença |
| 2 Ansiedade | `#FFF8F1` variável | `#F97316` pulsante → estável | tensão → ordem |
| 3 Autoestima | `#FFF8F1` rasante | dispersão cromática sutil (±1.5px) | percepção |
| 4 Flexibilidade | `#FFF8F1` topo | `#F97316` nas dobras (fresnel) | matéria |
| 5 Aceitação | esfera é a própria fonte | halo `--accent-soft` | repouso |
| 6–8 | DOM, sem WebGL pesado | grão + vinheta | sustentação |

### Proibido
Gradientes multicoloridos · azul "cérebro" · verde "saúde" · pastel · qualquer segunda cor de acento.

---

## 3. Tipografia

### Famílias
| Papel | Fonte | Fallback |
|---|---|---|
| Display / Headlines | **General Sans** (Variable) | Satoshi → Neue Montreal → `-apple-system, "Segoe UI", sans-serif` |
| UI / Corpo | **Satoshi** (Variable) | General Sans → system-ui |
| Mono (labels, índices) | **JetBrains Mono** ou `ui-monospace` | monospace |

Self-hosted via `next/font/local`, formato `woff2` variável, `font-display: swap`, subset latin+latin-ext.
Peso total do pacote tipográfico: **≤ 90 KB**.

### Escala (fluid, `clamp`)
| Token | Tamanho | Line-height | Tracking | Peso |
|---|---|---|---|---|
| `display-xl` | `clamp(3.25rem, 9.5vw, 10rem)` | 0.92 | −0.035em | 500 |
| `display-l` | `clamp(2.5rem, 6.5vw, 6rem)` | 0.96 | −0.03em | 500 |
| `display-m` | `clamp(2rem, 4.5vw, 3.75rem)` | 1.02 | −0.025em | 500 |
| `body-l` | `clamp(1.0625rem, 1.35vw, 1.375rem)` | 1.6 | −0.005em | 400 |
| `body-m` | `1rem` | 1.65 | 0 | 400 |
| `label` | `0.75rem` | 1.2 | 0.18em, uppercase | 500 |

### Regras
- Headlines: **máximo 3 linhas**, medida de 10–16 palavras. Quebra de linha manual e intencional.
- Corpo: medida de **60–72 caracteres** (`max-w-[62ch]`).
- Nunca justificar. Nunca `text-transform: uppercase` em corpo.
- Números e o CRP em tabular figures (`font-variant-numeric: tabular-nums`).
- Um único itálico permitido no site: nenhum. (Sem itálico.)

---

## 4. Grid e espaçamento

- **Grid:** 12 colunas desktop / 8 tablet / 4 mobile.
- **Gutter:** 24px desktop, 20px tablet, 16px mobile.
- **Margem lateral:** `clamp(1.25rem, 5vw, 7.5rem)`.
- **Largura máxima de conteúdo:** 1440px; texto nunca ultrapassa 8 colunas.
- **Escala de espaço (base 4):** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 192.
- **Altura de cena:** `100svh` mínimo; cenas com scrub usam `200–300svh` de trilho.

### Composição
- Âncora de leitura na **coluna 2–7** (desktop). Objeto WebGL ocupa 6–12 ou centro absoluto.
- Nenhum elemento a menos de 32px da borda viewport em desktop; 20px em mobile.
- Alinhamento óptico > alinhamento matemático em títulos grandes (hanging punctuation ativo).

---

## 5. Componentes

### Botão primário (`Button/primary`)
- Pill, altura 56px desktop / 52px mobile, padding `0 32px`.
- Fundo `--accent`, texto `--bg`, peso 500, tracking −0.01em.
- **Hover:** halo `--accent-soft` expande em 400ms `easeOutExpo`; label sobe 1px; ícone-seta desloca 4px.
- **Magnetismo:** raio 80px, deslocamento máximo 8px, spring `stiffness 150 / damping 15`. Desativado no touch.
- **Foco:** anel `2px --accent` + offset 3px em `--bg` (`:focus-visible`).
- **Active:** scale 0.98, 120ms.

### Botão secundário / ghost
Borda `--hairline`, texto `--text`. Hover: borda `--accent-line`, fundo `--surface` a 40%.

### Card de vidro (Cena 6)
`--glass` + `backdrop-filter: blur(16px) saturate(120%)`, borda 1px `--glass-edge`,
raio 20px, inner-shadow superior 1px `rgba(255,255,255,.06)`.
Hover: elevação `translateY(-4px)`, borda vira `--accent-line`, luz de acento segue o cursor
(spotlight radial de 260px em `--accent-soft`). 500ms `easeOutExpo`.

### Navbar
Topo: sem fundo, apenas o nome + CRP em `--muted` a 60%, e o CTA em ghost.
Após 12vh de scroll: `--glass` + blur 14px + hairline inferior, opacidade em rampa 0→1 (300ms).
Auto-hide ao rolar para baixo > 400px; reaparece ao rolar para cima.

### Cursor
- **Idle:** ponto 6px `--text` (opacidade 0.7) + anel 28px `--hairline`, lag do anel 0.12.
- **Hover interativo:** anel cresce para 48px, borda `--accent-line`, ponto some.
- **Hover em texto:** anel vira barra vertical 2×24px.
- **Click:** scale 0.85 por 120ms.
- Some após 2,5s sem movimento. Nunca renderizado em touch/coarse pointer. Sempre acompanha o cursor nativo (que **não** é escondido em elementos de formulário).

### Indicador de jornada
Trilho vertical de 1px na margem direita, 8 marcadores. Ativo = `--accent`, 4px. Clicável, com `aria-label` por cena.

---

## 6. Imagem e textura

- **Grão:** overlay de ruído estático, opacidade 3–4%, `mix-blend-mode: overlay`, tile 128px. Sem animação (custo zero).
- **Vinheta:** radial `--bg` de 55%→100%, alpha 0→0.55.
- **Sem fotografia de banco.** Uma única foto autoral opcional da Júlia na Cena 6 — enquadramento editorial, alto contraste, ambiente neutro escuro, olhar fora da câmera. Se não houver foto com qualidade suficiente, **não usar foto**.
- **Ícones:** apenas 3 no site inteiro (seta, close, som/movimento). Traço 1.5px, cantos retos.

---

## 7. Voz e tom

- Frases curtas. Verbos no presente. Primeira pessoa do plural apenas no processo terapêutico.
- Nunca imperativo emocional ("respire", "sinta", "não espere mais").
- Termos técnicos são usados e explicados na mesma frase.
- Nada de exclamação. Nada de emoji.
- Português do Brasil, linguagem neutra quanto a gênero quando se refere ao visitante.

---

## 8. Do / Don't (resumo de revisão de arte)

**Do:** silêncio · uma luz · um acento · tipografia grande · movimento lento · borda invisível.
**Don't:** segunda cor · gradiente decorativo · ícone ilustrativo · card genérico · animação que compete com o texto · qualquer clichê listado no PRD.
