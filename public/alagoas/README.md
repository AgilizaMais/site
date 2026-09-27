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
