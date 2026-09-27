# Alagoas para a PM-AL

Site estático de estudo, no mesmo molde do de Aracaju. Não usa nada do resto do
repositório — é HTML/CSS/JS puro dentro de `public/`, servido pelo Next em
`/alagoas/`.

| página | edital |
|---|---|
| `index.html` | **o mapa interativo** (item 3: litoral, Zona da Mata, Agreste, Sertão, rio São Francisco) |
| `historia.html` | itens 1 e 2 — colonização, açúcar, 1817, 1821 e o Quilombo dos Palmares |
| `estado.html` | itens 4, 5 e 6 — capital, municípios, poderes, economia, cultura e patrimônio |
| `simulado.html` | 31 questões comentadas, no estilo de banca, cobrindo os seis itens |
| `dados.js` | **todo o conteúdo do mapa** e a geometria |
| `mapa.js` | desenha o SVG e cuida de hover, clique, busca, camadas e zoom |
| `estilo.css` | estilo de todas as páginas |

## Como o mapa é desenhado

Desenho esquemático em SVG (`viewBox 0 0 1200 780`), com norte em cima e o
Atlântico à direita. Alagoas é alongada leste–oeste, então as quatro zonas
são **faixas verticais**, na ordem em que a umidade cai: Litoral → Zona da
Mata → Agreste → Sertão.

A geometria fica toda em `dados.js`:

- `NORTE` — a divisa com Pernambuco (oeste → leste)
- `COSTA` — o litoral (norte → sul)
- `SUL` — o rio São Francisco (oeste → leste)
- `LIN_SA`, `LIN_AM`, `LIN_ML` — as linhas que separam as zonas

Cada zona é montada por `poligonoZona()` em `mapa.js`, fatiando esses arrays
nos índices onde as linhas divisórias encostam. Por isso o desenho fecha sem
buracos: mexer num ponto de `NORTE` ajusta as zonas vizinhas juntas.

## Como editar o conteúdo

Tudo o que aparece no tooltip e no modal está em `dados.js`:

```js
{ id:"maceio", nome:"Maceió — capital", curto:"MACEIÓ",
  xy:[1010,318], anc:"dir", camadas:["geo","hist","eco"],
  destaque:true, zona:"litoral",
  resumo:"texto do tooltip",
  itens:[["Título do bloco","Texto do bloco no modal"]] }
```

- `xy` é a posição no mapa; `anc` diz de que lado o rótulo sai (`esq`/`dir`).
- `camadas` liga o ponto aos chips Geografia / História / Economia / Cultura.
- `destaque:true` deixa o pino dourado e maior (Maceió, Marechal Deodoro,
  União dos Palmares).
- `zona` liga o ponto à zona, o que alimenta o bloco "Veja também".

Vizinhos são polígonos montados em `mapa.js` a partir dos mesmos arrays;
rios são traçados (`AGUAS[].d`), a laguna é um polígono (`AGUAS[].pol`) e as
divisas secas ficam em `DIVISAS`.

## Fontes dos números

IBGE Cidades (área, população, municípios), IPHAN (tombamentos), Assembleia
Legislativa de Alagoas (27 deputados), literatura acadêmica sobre a Capitania
das Alagoas (Carta Régia de 16/09/1817; províncias em 28/02/1821).
