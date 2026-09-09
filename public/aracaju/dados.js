/* =========================================================
   Geografia de Aracaju — base de dados do mapa desenhado
   Coordenadas em um sistema próprio (viewBox 0 0 900 1400),
   orientado como o mapa real: Norte em cima, Leste (oceano)
   à direita, Sul embaixo.
   ========================================================= */

/* --- malha (lattice) do território de Aracaju ------------
   Cada linha vai de Oeste (col 0) para Leste (col 5).
   As linhas descem do Norte (A) para o Sul (M).
   Bairros são células entre duas linhas e duas colunas,
   por isso o desenho fecha sem buracos.                     */
const MALHA = {
  A: [[250,300],[335,320],[415,342],[490,372],[548,412],[600,462]],
  B: [[238,378],[325,398],[405,420],[480,450],[538,488],[592,534]],
  C: [[226,456],[315,476],[396,498],[470,528],[528,564],[584,606]],
  D: [[214,600],[305,596],[388,592],[462,596],[528,614],[600,606]],
  F: [[206,668],[300,660],[385,656],[465,656],[545,676],[645,620]],
  G: [[218,748],[310,742],[400,740],[485,746],[560,756],[650,700]],
  H: [[240,828],[330,824],[418,822],[500,828],[572,838],[642,790]],
  I: [[275,900],[358,900],[438,902],[512,908],[578,914],[634,876]],
  J: [[305,978],[378,978],[448,980],[518,984],[572,990],[622,960]],
  K: [[330,1060],[398,1062],[462,1064],[524,1068],[574,1072],[612,1044]],
  L: [[352,1145],[414,1147],[472,1149],[526,1151],[570,1154],[600,1128]],
  M: [[375,1228],[430,1230],[482,1232],[530,1234],[568,1236],[588,1212]]
};

/* --- zonas ---------------------------------------------- */
const ZONAS = {
  norte:    { nome: "Zona Norte",        cor: "#E08A3C", texto: "Berço da cidade, área industrial e portuária." },
  centro:   { nome: "Centro",            cor: "#C0563A", texto: "O Quadrado de Pirro e o comércio tradicional." },
  oeste:    { nome: "Zona Oeste",        cor: "#8465B0", texto: "Expansão popular ao longo do rio Poxim." },
  sul:      { nome: "Zona Sul",          cor: "#2F9E8F", texto: "Orla, verticalização e área mais valorizada." },
  expansao: { nome: "Zona de Expansão",  cor: "#C9A227", texto: "≈40% do território: dunas, lagoas, restinga e mangue." },
  terra:    { nome: "Divisa em terra",   cor: "#2B1D0E", texto: "Os trechos secos do limite — só a oeste e sudoeste." },
  agua:     { nome: "Rios e oceano",     cor: "#1B84C4", texto: "As águas que definem os limites do município." },
  vizinho:  { nome: "Municípios vizinhos",cor: "#B9AC96", texto: "Os cinco municípios limítrofes." }
};

/* --- bairros / setores ---------------------------------- */
const AREAS = [
  /* ---------------- ZONA NORTE / CENTRO (faixa do rio Sergipe) */
  { id:"porto-dantas", curto:"Porto Dantas", nome:"Porto Dantas · Coqueiral", zona:"norte", cel:["A","B",0,1],
    resumo:"Ponta norte da cidade, na margem do rio Sergipe.",
    itens:[
      ["Onde fica","Extremo norte do município, de frente para o estuário do rio Sergipe, junto ao rio do Sal."],
      ["Por que importa","Área portuária e industrial antiga; ali a cidade encosta no limite com Nossa Senhora do Socorro."],
      ["Ambiente","Manguezais do estuário — vegetação típica da planície fluviomarinha."]
    ]},
  { id:"santo-antonio", curto:"Santo Antônio", nome:"Santo Antônio — MARCO ZERO", zona:"norte", cel:["A","B",1,2], estrela:true,
    resumo:"A Colina de Santo Antônio: o berço de Aracaju.",
    itens:[
      ["Marco zero","No alto da Colina (Outeiro) de Santo Antônio a Assembleia Provincial aprovou a mudança da capital, em 17 de março de 1855."],
      ["Antes de 1855","Ali existia o povoado de Santo Antônio do Aracaju, na Barra da Cotinguiba, com capela documentada desde 1778."],
      ["Relevo","É o ponto alto de referência de uma cidade com altitude média de apenas 4 m."],
      ["Norma","Resolução (Lei Provincial) nº 413/1855, de Inácio Joaquim Barbosa."]
    ]},
  { id:"industrial", nome:"Industrial", zona:"norte", cel:["A","B",2,3],
    resumo:"Antiga zona fabril, entre a colina e o Centro.",
    itens:[
      ["Onde fica","Margem do rio Sergipe, descendo da colina de Santo Antônio para o Centro."],
      ["Origem","Nasceu das fábricas têxteis e do movimento do porto no fim do século XIX."]
    ]},
  { id:"getulio-vargas", nome:"Getúlio Vargas", zona:"centro", cel:["A","B",3,4],
    resumo:"Bairro de transição entre o norte antigo e o Centro.",
    itens:[
      ["Onde fica","Encostado no Centro, a noroeste do Quadrado de Pirro."],
      ["Marca","Bairro tradicional, residencial e de serviços, do primeiro anel de expansão do plano de 1855."]
    ]},
  { id:"centro", curto:"Centro", nome:"Centro — Quadrado de Pirro", zona:"centro", cel:["A","B",4,5], estrela:true,
    resumo:"O tabuleiro de xadrez projetado em 1855.",
    itens:[
      ["Quem desenhou","O engenheiro Sebastião José Basílio Pirro."],
      ["O traçado","32 quadras de 110 m × 110 m, ruas retas se cruzando em ângulo reto. Por isso Aracaju é a 2ª capital planejada do Brasil (depois de Teresina, 1852)."],
      ["Limites do plano original","Norte: base da colina de Santo Antônio · Sul: av. Desembargador Maynard · Leste: rio Sergipe (aterro da av. Ivo do Prado) · Oeste: cadeia de dunas, hoje av. Pedro Calazans."],
      ["Por que aqui","Terreno de mangue e alagado, mas na margem do rio Sergipe — onde ficavam a Alfândega e a Mesa de Rendas. Aracaju nasceu por causa do porto."]
    ]},

  { id:"cidade-nova", curto:"Cidade Nova", nome:"Cidade Nova · Japãozinho", zona:"norte", cel:["B","C",0,1],
    resumo:"Ocupação popular da zona norte.",
    itens:[
      ["Onde fica","Interior da zona norte, atrás da faixa do rio Sergipe."],
      ["Perfil","Área de ocupação antiga e alta vulnerabilidade social, tema recorrente em provas de atualidades."]
    ]},
  { id:"18-do-forte", curto:"18 do Forte", nome:"18 do Forte · Palestina", zona:"norte", cel:["B","C",1,2],
    resumo:"Bairros do miolo da zona norte.",
    itens:[
      ["Nome","'18 do Forte' lembra os 18 do Forte de Copacabana (1922)."],
      ["Onde fica","Entre Santo Antônio e o eixo da av. Gonçalo Rollemberg Leite."]
    ]},
  { id:"bugio", curto:"Bugio · Soledade", nome:"Soledade · Bugio · Lamarão", zona:"norte", cel:["B","C",2,3],
    resumo:"Conjuntos habitacionais da zona norte.",
    itens:[
      ["Origem","Conjuntos construídos a partir dos anos 1970/80 para abrigar a população que crescia fora do Centro."],
      ["Perfil","Densamente povoados, com os piores indicadores sociais do município."]
    ]},
  { id:"cirurgia", nome:"Cirurgia · Suíssa", zona:"centro", cel:["B","C",3,4],
    resumo:"Primeiro anel de expansão do Centro.",
    itens:[
      ["Onde fica","Logo a oeste/sul do Quadrado de Pirro."],
      ["Marca","Bairros residenciais antigos, formados quando a cidade transbordou as 32 quadras originais."]
    ]},
  { id:"sao-jose", curto:"São José", nome:"São José · Pereira Lobo", zona:"centro", cel:["B","C",4,5],
    resumo:"Área nobre tradicional, colada ao Centro.",
    itens:[
      ["Onde fica","Ao sul do Centro, entre a av. Ivo do Prado (rio Sergipe) e a av. Hermes Fontes."],
      ["Marca","Praça Fausto Cardoso, Palácio Olímpio Campos e o casario histórico do São José."]
    ]},

  { id:"olaria", curto:"Olaria", nome:"Olaria · Novo Paraíso", zona:"oeste", cel:["C","D",0,1],
    resumo:"Zona oeste, margem norte do rio Poxim.",
    itens:[
      ["Nome","'Olaria' lembra os fornos de barro do antigo povoado — barro tirado das margens do rio."],
      ["Onde fica","Oeste da cidade, no rumo de Nossa Senhora do Socorro."]
    ]},
  { id:"siqueira-campos", curto:"Siqueira Campos", nome:"Siqueira Campos · América", zona:"oeste", cel:["C","D",1,2],
    resumo:"O maior polo comercial fora do Centro.",
    itens:[
      ["Marca","Siqueira Campos tem a feira e o comércio popular mais movimentado da zona oeste."],
      ["Onde fica","A oeste do Centro, no eixo da av. Coelho e Campos / João Ribeiro."]
    ]},
  { id:"capucho", curto:"Capucho", nome:"Capucho · Ponto Novo", zona:"oeste", cel:["C","D",2,3],
    resumo:"Bairros de classe média a oeste, junto ao Poxim.",
    itens:[
      ["Onde fica","Entre a av. Hermes Fontes e a margem do rio Poxim."],
      ["Ambiente","Área sujeita a alagamento nas cheias do Poxim."]
    ]},
  { id:"luzia-grageru", curto:"Luzia · Jardins", nome:"Luzia · Grageru · Jardins", zona:"sul", cel:["C","D",3,4],
    resumo:"Eixo de verticalização e serviços.",
    itens:[
      ["Marca","Bairro Jardins concentra shoppings, torres residenciais e o setor de serviços mais caro da cidade."],
      ["Onde fica","Entre a av. Hermes Fontes e a av. Beira-Mar / rio Poxim."]
    ]},
  { id:"13-de-julho", curto:"13 de Julho", nome:"13 de Julho — praia de rio", zona:"centro", cel:["C","D",4,5], estrela:true,
    resumo:"Orla do rio Sergipe, não do oceano.",
    itens:[
      ["Pegadinha clássica","A Praia 13 de Julho fica às margens do RIO SERGIPE, e não do Oceano Atlântico."],
      ["Onde fica","Sul do Centro, na av. Beira-Mar, olhando para a Barra dos Coqueiros do outro lado do rio."],
      ["Marca","Área mais valorizada do município; ponto de partida da ponte Godofredo Diniz para a Coroa do Meio."]
    ]},

  /* ---------------- ZONA SUL (ao sul do rio Poxim) */
  { id:"jabotiana", nome:"Jabotiana", zona:"oeste", cel:["F","G",0,1],
    resumo:"Fronteira de expansão imobiliária às margens do Poxim.",
    itens:[
      ["Onde fica","Sudoeste do município, acompanhando o rio Poxim rumo a São Cristóvão."],
      ["Problema","Ocupação acelerada sobre área de várzea e mata ciliar — alagamentos frequentes."]
    ]},
  { id:"inacio-barbosa", nome:"Inácio Barbosa", zona:"sul", cel:["F","G",1,2],
    resumo:"Bairro que homenageia o fundador da cidade.",
    itens:[
      ["Nome","Inácio Joaquim Barbosa, presidente da província que transferiu a capital em 1855."],
      ["Ligação","A ponte Gilberto Vila-Nova de Carvalho (2013) liga o conjunto Augusto Franco à av. Tancredo Neves por aqui."]
    ]},
  { id:"sao-conrado", curto:"São Conrado", nome:"São Conrado · Augusto Franco", zona:"sul", cel:["F","G",2,3],
    resumo:"Grandes conjuntos habitacionais da zona sul.",
    itens:[
      ["Origem","Conjuntos dos anos 1980 que empurraram a cidade para o sul do rio Poxim."],
      ["Onde fica","Entre o Poxim e a av. Tancredo Neves."]
    ]},
  { id:"salgado-filho", curto:"Salgado Filho", nome:"Salgado Filho · Coroa do Meio (interior)", zona:"sul", cel:["F","G",3,4],
    resumo:"Miolo da zona sul, entre o Poxim e a orla.",
    itens:[
      ["Onde fica","Entre a foz do Poxim e a av. Beira-Mar."],
      ["Marca","Área de aterro conquistada sobre o mangue nas décadas de 1970/80."]
    ]},
  { id:"coroa-do-meio", curto:"Coroa do Meio", nome:"Coroa do Meio — onde o rio encontra o mar", zona:"sul", cel:["F","G",4,5], estrela:true,
    resumo:"Primeira praia oceânica de Aracaju, na foz do Sergipe.",
    itens:[
      ["Posição-chave","É aqui que a orla deixa de ser rio e passa a ser oceano: a foz do rio Sergipe fica logo ao norte."],
      ["Origem","Bairro inteiramente criado por aterro sobre mangue e coroa de areia, a partir dos anos 1970."],
      ["Acesso","Chegou-se a ela pela ponte Godofredo Diniz, sobre o rio Poxim, vinda do 13 de Julho."],
      ["Sequência das praias (N→S)","Coroa do Meio → Atalaia → Aruana → Robalo → Náufragos → Mosqueiro."]
    ]},

  { id:"farolandia", nome:"Farolândia", zona:"sul", cel:["G","H",0,2],
    resumo:"Bairro universitário e residencial da zona sul.",
    itens:[
      ["Nome","Vem do farol da Coroa do Meio, referência para a navegação na foz do Sergipe."],
      ["Marca","Concentra campus universitário e forte comércio de bairro."]
    ]},
  { id:"aeroporto", curto:"Aeroporto", nome:"Aeroporto · Santa Maria (interior)", zona:"sul", cel:["G","H",2,4],
    resumo:"Bairro do aeroporto Santa Maria.",
    itens:[
      ["Equipamento","Aeroporto Internacional de Aracaju — Santa Maria, na zona sul, a caminho da Zona de Expansão."],
      ["Ambiente","Cercado por manguezais do Poxim e do canal Santa Maria."]
    ]},
  { id:"atalaia", curto:"Atalaia", nome:"Atalaia — cartão-postal", zona:"sul", cel:["G","H",4,5], estrela:true,
    resumo:"A principal praia e área de lazer da capital.",
    itens:[
      ["Marca","Orla de Atalaia: Passarela do Caranguejo, Oceanário e o maior complexo de lazer da cidade."],
      ["Onde fica","Litoral leste, ao sul da Coroa do Meio, voltada para o Oceano Atlântico."],
      ["Bizu","Atalaia é MAR. 13 de Julho é RIO. Não troque as duas."]
    ]},
  { id:"santa-maria", curto:"Santa Maria", nome:"Santa Maria · canal Santa Maria", zona:"sul", cel:["H","I",0,3],
    resumo:"Interior sul, junto ao canal que liga o Poxim ao Vaza-Barris.",
    itens:[
      ["Canal Santa Maria","Ligação artificial entre a bacia do rio Poxim e o rio Vaza-Barris; aparece como referência do limite sul."],
      ["Perfil","Área de mangue, ocupação popular e do aterro sanitário da capital."]
    ]},
  { id:"orla-sul", curto:"Orla Nova", nome:"Orla Nova · saída para a Expansão", zona:"sul", cel:["H","I",3,5],
    resumo:"Trecho da SE-100 que leva à Zona de Expansão.",
    itens:[
      ["Eixo","A rodovia SE-100 sul corre paralela ao mar e organiza toda a ocupação da Zona de Expansão."],
      ["Ambiente","Cordões de dunas e restinga entre a estrada e o mar."]
    ]},

  /* ---------------- ZONA DE EXPANSÃO */
  { id:"aruana", nome:"Aruana", zona:"expansao", cel:["I","J",0,5],
    resumo:"Porta de entrada da Zona de Expansão.",
    itens:[
      ["Onde fica","Logo ao sul da Atalaia, primeira praia da Zona de Expansão."],
      ["Ambiente","Restinga, dunas e lagoas costeiras — área de alta fragilidade ambiental."]
    ]},
  { id:"17-de-marco", curto:"17 de Março", nome:"17 de Março · Santa Maria (expansão)", zona:"expansao", cel:["J","K",0,3],
    resumo:"Lado interior da Zona de Expansão, voltado ao Vaza-Barris.",
    itens:[
      ["Nome","17 de Março é a data de fundação de Aracaju (1855)."],
      ["Ocupação","Loteamentos populares afastados da orla, no rumo do rio Vaza-Barris."]
    ]},
  { id:"areia-branca", nome:"Areia Branca · Gameleira", zona:"expansao", cel:["J","K",3,5],
    resumo:"Dois dos bairros criados pela Lei 5.373/2021.",
    itens:[
      ["Lei 5.373/2021","Transformou 6 localidades da Zona de Expansão em bairros: Mosqueiro, Robalo, São José dos Náufragos, Areia Branca, Gameleira e Matapuã — projeto 'Cidade Expansão'."],
      ["Efeito","Com isso Aracaju passou a contar 43 bairros (antes a referência tradicional era 39)."]
    ]},
  { id:"matapua", nome:"Matapuã", zona:"expansao", cel:["K","L",0,3],
    resumo:"Bairro criado em 2021, no interior da Expansão.",
    itens:[
      ["Onde fica","Entre a orla e o rio Vaza-Barris, a caminho do Mosqueiro."],
      ["Ambiente","Lagoas, coqueirais e áreas de restinga."]
    ]},
  { id:"robalo", nome:"Robalo", zona:"expansao", cel:["K","L",3,5],
    resumo:"Praia e povoado transformado em bairro em 2021.",
    itens:[
      ["Litoral","Quarta praia na sequência norte→sul: depois de Aruana, antes de Náufragos."],
      ["Perfil","Antiga colônia de pescadores, hoje sob forte pressão imobiliária."]
    ]},
  { id:"mosqueiro", nome:"Mosqueiro — ponta sul", zona:"expansao", cel:["L","M",0,3],
    resumo:"O extremo sul de Aracaju, na margem do Vaza-Barris.",
    itens:[
      ["Orla Pôr do Sol","Voltada para o rio Vaza-Barris — por isso o sol se põe sobre a água, e não sobre o mar."],
      ["Ponte Joel Silveira","Inaugurada em 2010, sai do Mosqueiro sobre o Vaza-Barris e liga Aracaju a Itaporanga d'Ajuda pela SE-100 sul."],
      ["Disputa judicial","Toda essa área é reivindicada por São Cristóvão; o caso chegou ao STF. Para a prova, pertence a Aracaju."]
    ]},
  { id:"naufragos", nome:"São José dos Náufragos", zona:"expansao", cel:["L","M",3,5],
    resumo:"Última praia antes da foz do Vaza-Barris.",
    itens:[
      ["Litoral","Quinta praia na sequência norte→sul; depois dela só o Mosqueiro, já voltado para o rio."],
      ["Bairro desde 2021","Criado pela Lei municipal 5.373/2021."]
    ]}
];

/* --- águas ---------------------------------------------- */
const AGUAS = [
  { id:"oceano", nome:"Oceano Atlântico", tipo:"mar", lado:"Leste", cor:"#1273AF", dir:"L",
    rotulo:[795,830], largura:0,
    resumo:"O limite LESTE de Aracaju — sempre.",
    itens:[
      ["Regra de ouro","A leste, Aracaju faz limite com o Oceano Atlântico. Nunca com Barra dos Coqueiros (que fica a NORDESTE, do outro lado da foz do rio Sergipe)."],
      ["Extensão","O litoral vai da foz do rio Sergipe (norte) à foz do rio Vaza-Barris (sul)."],
      ["Praias (N→S)","Coroa do Meio · Atalaia · Aruana · Robalo · Náufragos · Mosqueiro."]
    ]},
  { id:"rio-sergipe", nome:"Rio Sergipe", tipo:"rio",
    d:"M 30 186 L 180 250 L 300 275 L 420 300 L 520 340 L 592 402 L 642 470 L 664 548",
    largura:26, rotulo:[400,268], rotAng:12,
    resumo:"O rio da fundação: nordeste e leste do Centro.",
    itens:[
      ["Onde corre","Desce do noroeste, contorna o norte da cidade e desemboca no Atlântico a nordeste."],
      ["Foz","A foz separa Aracaju de Barra dos Coqueiros. O trecho final era chamado barra da Cotinguiba."],
      ["Característica","Salobro no trecho urbano; foi a via do açúcar que justificou a criação da capital em 1855."],
      ["Ponte","Ponte Construtor João Alves (2006), ~1.800 m, maior ponte urbana do Nordeste."]
    ]},
  { id:"rio-do-sal", nome:"Rio do Sal", tipo:"rio",
    d:"M 34 398 L 108 422 L 178 446 L 226 456 L 238 378 L 258 300",
    largura:16, rotulo:[92,428], rotAng:16,
    resumo:"O limite NORTE, com Nossa Senhora do Socorro.",
    itens:[
      ["Função","Faz o limite norte de Aracaju com Nossa Senhora do Socorro."],
      ["Bacia","É um dos últimos afluentes do rio Sergipe, no qual deságua."],
      ["Ponte","Ponte José Rolemberg Leite, ligando a zona norte ao conjunto João Alves, em Socorro."]
    ]},
  { id:"rio-poxim", nome:"Rio Poxim", tipo:"rio",
    d:"M 70 646 L 210 640 L 330 628 L 430 622 L 510 632 L 570 652 L 615 620 L 645 560 L 662 510",
    largura:18, rotulo:[330,612], rotAng:-4,
    resumo:"O rio interno: corta a cidade e cria as pontes urbanas.",
    itens:[
      ["Onde corre","Entra pelo oeste, atravessa a cidade e deságua no rio Sergipe, perto da Coroa do Meio."],
      ["Formação","Formado pelo encontro do Poxim-Açu com o Poxim-Mirim."],
      ["Pontes internas","Presidente Juscelino, Godofredo Diniz e Gilberto Vila-Nova de Carvalho — todas ligam bairros de Aracaju entre si."],
      ["Bizu","Poxim = ponte INTERNA. Sergipe, do Sal e Vaza-Barris = pontes que saem do município."]
    ]},
  { id:"vaza-barris", nome:"Rio Vaza-Barris", tipo:"rio",
    d:"M 60 1176 L 110 1200 L 250 1225 L 370 1252 L 470 1272 L 545 1288 L 600 1262",
    largura:22, rotulo:[300,1252], rotAng:12,
    resumo:"O limite SUL, com Itaporanga d'Ajuda.",
    itens:[
      ["Nascente","Nasce na Bahia e faz o limite sul do município."],
      ["Ligação","Conecta-se à bacia do Poxim pelo canal Santa Maria."],
      ["Ponte","Ponte Joel Silveira (2010), da Zona de Expansão para Itaporanga d'Ajuda, pela SE-100 sul."],
      ["Curiosidade","A Orla Pôr do Sol, no Mosqueiro, é voltada para este rio."]
    ]}
];

/* --- municípios vizinhos -------------------------------- */
const VIZINHOS = [
  { id:"santo-amaro", nome:"Santo Amaro das Brotas", lado:"Norte", cor:"#7B4FA8", dir:"N",
    pol:[[0,0],[300,0],[380,120],[440,235],[300,275],[180,250],[30,186],[0,170]],
    rotulo:[190,110],
    resumo:"Vizinho ao norte, do outro lado do rio Sergipe.",
    itens:[["Separado por","Estuário do rio Sergipe / rio do Sal."],
           ["Atenção","É limítrofe, mas NÃO faz parte da Região Metropolitana de Aracaju."]]},
  { id:"barra-dos-coqueiros", nome:"Barra dos Coqueiros", lado:"Nordeste", cor:"#E4572E", dir:"NE",
    pol:[[664,548],[642,470],[592,402],[520,340],[440,235],[380,120],[300,0],[640,0],[790,175],[830,320],[785,445],[722,508]],
    rotulo:[690,230],
    resumo:"Vizinho a NORDESTE, alcançado por ponte.",
    itens:[
      ["Separado por","A foz do rio Sergipe."],
      ["Ponte","Ponte Construtor João Alves, inaugurada em 24/09/2006, com cerca de 1.800 m."],
      ["Porto","O Terminal Marítimo Inácio Barbosa (porto de Sergipe) fica AQUI, não em Aracaju."],
      ["RMA","Integra a Região Metropolitana de Aracaju."]
    ]},
  { id:"socorro", nome:"Nossa Senhora do Socorro", lado:"Norte e Oeste", cor:"#1F9E6E", dir:"N / O",
    pol:[[0,170],[30,186],[180,250],[258,300],[238,378],[226,456],[214,600],[100,478],[0,480]],
    rotulo:[105,330],
    resumo:"Vizinho ao norte e a oeste, separado pelo rio do Sal.",
    itens:[
      ["Separado por","Rio do Sal (norte) e limite terrestre (oeste)."],
      ["Marca","Abriga os grandes conjuntos habitacionais do complexo da Taiçoca."],
      ["RMA","Integra a Região Metropolitana de Aracaju."]
    ]},
  { id:"sao-cristovao", nome:"São Cristóvão", lado:"Oeste e Sul", cor:"#C98A1E", dir:"O / S",
    pol:[[0,480],[100,478],[214,600],[206,668],[218,748],[240,828],[275,900],[305,978],[330,1060],[352,1145],[375,1228],[250,1225],[110,1200],[0,1180]],
    rotulo:[120,880],
    resumo:"Vizinho a oeste e ao sul — a antiga capital.",
    itens:[
      ["História","Foi a capital de Sergipe até 1855, quando Aracaju foi criada."],
      ["Separado por","Limite terrestre e o rio Poxim."],
      ["Disputa","Reivindica judicialmente a área da Zona de Expansão (Mosqueiro, Robalo, Areia Branca…). O caso chegou ao STF."],
      ["Marca","Abriga o campus da UFS, no Rosa Elze. Integra a RMA."]
    ]},
  { id:"itaporanga", nome:"Itaporanga d'Ajuda", lado:"Sul", cor:"#B23A6F", dir:"S",
    pol:[[0,1180],[110,1200],[250,1225],[370,1252],[470,1272],[545,1288],[600,1262],[620,1400],[0,1400]],
    rotulo:[230,1330],
    resumo:"Vizinho ao SUL, do outro lado do Vaza-Barris.",
    itens:[
      ["Separado por","Rio Vaza-Barris."],
      ["Ponte","Ponte Joel Silveira (2010), pela SE-100 sul."],
      ["Atenção","É limítrofe, mas NÃO integra a Região Metropolitana de Aracaju."]
    ]}
];

/* --- pontos: pontes e marcos ---------------------------- */
const PONTOS = [
  { id:"p-joao-alves", tipo:"ponte", curto:"Ponte João Alves", nome:"Ponte Construtor João Alves", xy:[634,456], anc:"dir",
    ang:-36, vao:96, saida:"barra-dos-coqueiros",
    resumo:"Rio Sergipe · Aracaju ⇄ Barra dos Coqueiros",
    itens:[
      ["Rio","Rio Sergipe (foz)."],
      ["Liga","Aracaju à Barra dos Coqueiros."],
      ["Data","24 de setembro de 2006."],
      ["Tamanho","Cerca de 1.800 m — a maior ponte urbana do Nordeste."],
      ["Efeito","Abriu o litoral norte e o acesso ao Terminal Marítimo Inácio Barbosa."]
    ]},
  { id:"p-rolemberg", tipo:"ponte", nome:"Ponte José Rolemberg Leite", curto:"P. Rolemberg Leite", xy:[237,394], anc:"esq",
    ang:9, vao:60, saida:"socorro",
    resumo:"Rio do Sal · Aracaju ⇄ N. S. do Socorro",
    itens:[
      ["Rio","Rio do Sal."],
      ["Liga","Zona norte de Aracaju ao conjunto João Alves, em Nossa Senhora do Socorro."],
      ["Papel","É a ponte do limite norte."]
    ]},
  { id:"p-godofredo", tipo:"ponte", curto:"Ponte Godofredo Diniz", nome:"Ponte Godofredo Diniz", xy:[620,610], anc:"dir", ang:27, vao:52,
    resumo:"Rio Poxim · 13 de Julho ⇄ Coroa do Meio",
    itens:[
      ["Rio","Rio Poxim."],
      ["Liga","Bairro 13 de Julho à Coroa do Meio — a 'ponte do shopping'."],
      ["Época","Anos 1970, gestão João Alves Filho."],
      ["Efeito","Viabilizou a ocupação da orla e o acesso à Atalaia."]
    ]},
  { id:"p-juscelino", tipo:"ponte", curto:"P. Pres. Juscelino", nome:"Ponte Presidente Juscelino", xy:[556,652], anc:"esq", ang:-72, vao:48,
    resumo:"Rio Poxim · a mais antiga sobre o Poxim",
    itens:[
      ["Rio","Rio Poxim."],
      ["História","Viabilizada após o desmonte do Morro do Bonfim, a duna que forneceu areia para os aterros."],
      ["Efeito","Ligou o Centro ao caminho do mar e acabou com a travessia de balsas."]
    ]},
  { id:"p-gilberto", tipo:"ponte", curto:"P. Gilberto Vila-Nova", nome:"Ponte Gilberto Vila-Nova de Carvalho", xy:[432,622], anc:"esq", ang:-83, vao:48,
    resumo:"Rio Poxim · Augusto Franco ⇄ av. Tancredo Neves",
    itens:[
      ["Rio","Rio Poxim."],
      ["Data","Entregue em 2013, no aniversário de 158 anos da cidade."],
      ["Liga","Conjunto Augusto Franco à avenida Tancredo Neves, pelo bairro Inácio Barbosa."]
    ]},
  { id:"p-joel", tipo:"ponte", curto:"Ponte Joel Silveira", nome:"Ponte Joel Silveira", xy:[470,1272], anc:"dir",
    ang:-79, vao:86, saida:"itaporanga",
    resumo:"Rio Vaza-Barris · Mosqueiro ⇄ Itaporanga d'Ajuda",
    itens:[
      ["Rio","Rio Vaza-Barris."],
      ["Data","2010."],
      ["Liga","Zona de Expansão (Mosqueiro) a Itaporanga d'Ajuda, pela SE-100 sul."],
      ["Efeito","Abriu o litoral sul do estado."]
    ]},
  { id:"marco-zero", tipo:"marco", curto:"MARCO ZERO", nome:"Marco Zero — Colina de Santo Antônio", xy:[400,344], anc:"dir",
    resumo:"Onde Aracaju nasceu, em 17/03/1855",
    itens:[
      ["O que é","O Outeiro (Colina) de Santo Antônio, ponto alto onde ficava o povoado e onde a Assembleia Provincial aprovou a transferência da capital."],
      ["Data","17 de março de 1855 — aniversário da cidade."],
      ["Norma","Resolução (Lei Provincial) nº 413."],
      ["Fundador","Inácio Joaquim Barbosa, presidente da província."],
      ["Projetista","Sebastião José Basílio Pirro, engenheiro do Quadrado."],
      ["Detalhe","A cidade nova foi implantada cerca de 500 m ao SUL da colina, em terreno de mangue, para ficar na margem do rio."]
    ]},
  { id:"aeroporto-pt", tipo:"marco", curto:"Aeroporto Santa Maria", nome:"Aeroporto Santa Maria", xy:[520,800], anc:"dir",
    resumo:"Aeroporto Internacional de Aracaju",
    itens:[["Onde","Zona sul, entre a Atalaia e a Zona de Expansão."],
           ["Ambiente","Cercado pelos manguezais do Poxim e do canal Santa Maria."]]},
  { id:"foz-sergipe", tipo:"marco", curto:"Foz do Sergipe", nome:"Foz do rio Sergipe", xy:[672,556], anc:"dir",
    resumo:"Onde o rio Sergipe encontra o Atlântico",
    itens:[["Divisa","Separa Aracaju (oeste) de Barra dos Coqueiros (leste/nordeste)."],
           ["Antigo nome","Barra da Cotinguiba."]]},
  { id:"foz-vb", tipo:"marco", curto:"", nome:"Foz do rio Vaza-Barris", xy:[600,1262], anc:"esq",
    resumo:"Ponto mais ao sul do litoral de Aracaju",
    itens:[["Divisa","Separa Aracaju de Itaporanga d'Ajuda."]]}
];

/* --- rosa dos ventos / síntese dos limites -------------- */
const LIMITES = [
  ["Norte","Nossa Senhora do Socorro e Santo Amaro das Brotas","Rio do Sal / estuário do rio Sergipe"],
  ["Nordeste","Barra dos Coqueiros","Rio Sergipe (Ponte Construtor João Alves)"],
  ["Leste","Oceano Atlântico","Faixa litorânea / praias"],
  ["Sul","São Cristóvão e Itaporanga d'Ajuda","Rio Vaza-Barris e canal Santa Maria (Ponte Joel Silveira)"],
  ["Oeste","São Cristóvão e Nossa Senhora do Socorro","Limite terrestre e rio Poxim"]
];

/* --- divisas em TERRA (o único lado de Aracaju que não é água) --- */
const DIVISAS = [
  { id:"divisa-socorro", nome:"Divisa em terra com Nossa Senhora do Socorro",
    tipo:"terra", cor:"#1F9E6E", vizinho:"socorro",
    linha:[[226,456],[214,600]], rotulo:[172,552],
    resumo:"Trecho seco do limite oeste, ao sul do rio do Sal.",
    itens:[
      ["O que é","Depois que o rio do Sal termina, o limite com Nossa Senhora do Socorro deixa de ser água e vira uma linha em terra firme."],
      ["Onde passa","No rumo oeste da zona norte/oeste — bairros como Olaria, Novo Paraíso e Capucho encostam nesse trecho."],
      ["Na prova","Socorro aparece nas DUAS naturezas: ao NORTE separado pelo rio do Sal, a OESTE por divisa terrestre. Se a questão disser que o limite com Socorro é só fluvial, está incompleta."]
    ]},
  { id:"divisa-sao-cristovao", nome:"Divisa em terra com São Cristóvão",
    tipo:"terra", cor:"#C98A1E", vizinho:"sao-cristovao",
    linha:[[214,600],[206,668],[218,748],[240,828],[275,900],[305,978],[330,1060],[352,1145],[375,1228]],
    rotulo:[236,1010],
    resumo:"A maior divisa seca de Aracaju, do Poxim até o Vaza-Barris.",
    itens:[
      ["O que é","Desce por todo o flanco oeste e sudoeste da cidade, do rio Poxim até a margem do rio Vaza-Barris."],
      ["Onde passa","Jabotiana, Santa Maria e a borda oeste da Zona de Expansão fazem fundo com São Cristóvão."],
      ["Rio Poxim","Parte do traçado acompanha o rio Poxim, que entra em Aracaju vindo de São Cristóvão — por isso ele às vezes é citado como referência do limite oeste."],
      ["Disputa","É justamente esse trecho que São Cristóvão questiona na Justiça: o município reivindica a área da antiga Zona de Expansão. O caso chegou ao STF; para a prova, a área é de Aracaju."]
    ]}
];

/* --- síntese: como Aracaju se separa de cada vizinho --- */
const TRAVESSIAS = [
  { vizinho:"socorro",            natureza:"Água + terra", como:"Rio do Sal (norte) e divisa terrestre (oeste)", ponte:"Ponte José Rolemberg Leite" },
  { vizinho:"santo-amaro",        natureza:"Água",         como:"Estuário do rio Sergipe",                       ponte:"— (sem ponte direta)" },
  { vizinho:"barra-dos-coqueiros",natureza:"Água",         como:"Foz do rio Sergipe",                            ponte:"Ponte Construtor João Alves" },
  { vizinho:"sao-cristovao",      natureza:"Terra",        como:"Divisa terrestre (e rio Poxim como referência)",ponte:"— (não precisa de ponte)" },
  { vizinho:"itaporanga",         natureza:"Água",         como:"Rio Vaza-Barris",                               ponte:"Ponte Joel Silveira" }
];
