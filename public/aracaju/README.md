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
juntos. Rios são traçados (`AGUAS[].d`), vizinhos são polígonos (`VIZINHOS[].pol`)
e pontes/marcos são pontos (`PONTOS[].xy`).
