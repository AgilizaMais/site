# Mapa interativo de Aracaju

Site estático de estudo (geografia de Aracaju/SE para concurso). Não usa
nenhuma dependência do resto do repositório — é HTML/CSS/JS puro dentro de
`public/`, então o Next serve tudo direto:

- `/aracaju/` → **index.html** — o mapa desenhado e interativo (parte principal)
- `/aracaju/resumo.html` → o resumão em texto + simulado (versão anterior, preservada)

## Arquivos

| arquivo | o que é |
|---|---|
| `index.html` | página do mapa: controles, legenda, modal e tabela de limites |
| `estilo.css` | estilo de tudo (mapa, tooltip, modal, seções) |
| `dados.js` | **todo o conteúdo**: malha do desenho, bairros, rios, vizinhos, pontes e textos |
| `mapa.js` | desenha o SVG e cuida de hover, clique, busca, filtro e zoom |
| `resumo.html` | o site em texto que já existia, com link para o mapa |

## Hierarquia visual

A cor está nos **municípios vizinhos**, não nos bairros: cada limítrofe tem sua
própria cor e um selo de direção (N, NE, L, O, S), e Aracaju fica neutra no meio.
É o recorte que as questões cobram ("qual município faz limite ao norte?").
O botão *Colorir bairros por zona* liga o modo antigo, com Aracaju pintada por
zona, para estudar a divisão interna.

Dois destaques carregam a resposta das questões de limite:

- **Divisa em terra** (`DIVISAS` em `dados.js`): linha preta com tracejado na cor do
  vizinho, sobre o flanco oeste/sudoeste. É o único lado seco de Aracaju.
- **Pontes que saem do município** (`PONTOS[].saida`): desenhadas como tabuleiro
  dourado atravessando o rio, com o município de destino escrito embaixo. As pontes
  internas (rio Poxim) ficam menores e vermelhas.

Os chips *Divisa em terra* e *Pontes que saem de Aracaju* isolam cada um desses
grupos no mapa.

## Como o mapa é desenhado

Não é um mapa geográfico real (sem GeoJSON, sem biblioteca). É um **desenho
esquemático** em SVG (`viewBox 0 0 900 1400`, norte em cima, oceano à direita),
construído sobre uma malha (`MALHA` em `dados.js`): linhas A→M do norte ao sul,
colunas 0→5 do oeste ao leste. Cada bairro é uma célula entre duas linhas e duas
colunas, o que faz o desenho fechar sem buracos.

Para mexer em um bairro, edite `AREAS` em `dados.js`:

```js
{ id:"centro", curto:"Centro", nome:"Centro — Quadrado de Pirro",
  zona:"centro", cel:["A","B",4,5], estrela:true,
  resumo:"texto do tooltip",
  itens:[["Título do bloco","Texto do bloco no modal"]] }
```

`cel` = `[linhaDeCima, linhaDeBaixo, colunaInicial, colunaFinal]`. Para mudar o
formato do território, mexa nos pontos da `MALHA` — todos os bairros se ajustam
juntos. Rios são traçados (`AGUAS[].d`; `pequeno:true` deixa o rótulo menor, caso do Pitanga), vizinhos são polígonos (`VIZINHOS[].pol`, cada um
com `cor` e `dir`) e pontes/marcos são pontos (`PONTOS[].xy`, com `ang`/`vao` para o tabuleiro e
`saida` para marcar a ponte como intermunicipal).

## Versão de arquivo único

A pasta `_arquivo-unico/` traz as mesmas páginas com o CSS e o JS **embutidos
no próprio HTML**. Cada arquivo funciona sozinho, sem precisar de `estilo.css`,
`dados.js` ou `mapa.js` ao lado — útil quando a hospedagem não entrega os `.js`
ou quando só os `.html` são enviados. Sintoma que isso resolve: a moldura do
mapa aparece azul e vazia.

Esses arquivos são **gerados**, não editados à mão. Depois de mexer no código,
rode na pasta `public/`:

```
python3 gerar-arquivo-unico.py
```

## Ícone e atalho na tela de início

O ícone é a própria silhueta do mapa, gerada a partir das mesmas coordenadas
de `dados.js` (veja `icone.svg`). Arquivos: `icone-512.png`, `icone-192.png`,
`icone-180.png`, `icone-64.png` e `site.webmanifest`.

Na versão de arquivo único, o favicon e o manifest (com os PNGs dentro dele)
são **embutidos como data URI** pelo `gerar-arquivo-unico.py` — o atalho no
Android funciona mesmo que só os `.html` sejam enviados ao servidor.

A exceção é o iPhone: o iOS **não aceita data URI** em `apple-touch-icon`, então
esse link continua apontando para o arquivo. Para o ícone aparecer no atalho do
iPhone, `icone-180.png` precisa estar na mesma pasta dos HTML. Sem ele, o iOS
usa uma miniatura da página — o atalho funciona, só fica sem o desenho.
