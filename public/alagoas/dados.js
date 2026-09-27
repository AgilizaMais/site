/* =========================================================
   Alagoas para a prova — base de dados do mapa desenhado
   viewBox 0 0 1200 780. Norte em cima, Leste (oceano) à
   direita, Sul embaixo (rio São Francisco).
   O estado é alongado no sentido Oeste→Leste: o Sertão fica
   na ponta oeste e o Litoral na faixa leste.
   ========================================================= */

/* --- contorno de Alagoas -------------------------------- */
/* divisa NORTE, em terra, com Pernambuco (oeste → leste) */
const NORTE = [[70,430],[130,386],[215,345],[310,318],[420,286],[540,250],
               [660,214],[780,176],[900,145],[985,127],[1046,120]];
/* costa (norte → sul) */
const COSTA = [[1046,120],[1074,170],[1082,235],[1072,305],[1052,375],[1024,442],
               [988,505],[944,562],[900,612],[866,660],[846,692]];
/* divisa SUL: rio São Francisco (oeste → leste), com Bahia e Sergipe */
const SUL   = [[70,430],[128,462],[196,492],[276,540],[356,582],[436,614],
               [520,640],[590,658],[676,674],[776,690],[846,692]];

/* linhas que separam as quatro zonas fisiográficas */
const LIN_SA = [[420,286],[404,360],[392,432],[378,506],[356,582]];              /* Sertão | Agreste */
const LIN_AM = [[660,214],[652,300],[642,392],[626,486],[604,580],[590,658]];    /* Agreste | Mata   */
const LIN_ML = [[900,145],[928,230],[930,320],[912,406],[880,486],[840,560],
                [800,626],[776,690]];                                            /* Mata | Litoral  */

/* --- as quatro zonas ------------------------------------ */
const ZONAS = [
  { id:"sertao", nome:"Sertão", cor:"#C0492F", lado:"Oeste",
    rotulo:[252,348], sub:"semiárido · caatinga",
    resumo:"Semiárido, caatinga e o rio São Francisco.",
    itens:[
      ["Onde fica","Toda a porção OESTE do estado, a mais afastada do mar e a maior em área."],
      ["Clima e vegetação","Semiárido quente, com caatinga e chuvas escassas e irregulares. É a área mais seca de Alagoas."],
      ["O rio que salva","O São Francisco corre pela borda sul do Sertão: é dele que vêm a irrigação, a energia (Xingó) e o abastecimento."],
      ["Cidades-chave","Delmiro Gouveia, Piranhas, Santana do Ipanema, Mata Grande, Água Branca, Pariconha."],
      ["Relevo","Aqui está o ponto mais alto de Alagoas: a Serra da Onça, em Mata Grande, com cerca de 1.016 m."],
      ["Economia","Pecuária extensiva, agricultura de sequeiro, fruticultura irrigada às margens do São Francisco e energia hidrelétrica."]
    ]},
  { id:"agreste", nome:"Agreste", cor:"#D98A2B", lado:"Centro",
    rotulo:[530,336], sub:"transição",
    resumo:"A faixa de transição entre a Mata úmida e o Sertão seco.",
    itens:[
      ["O que é","Zona de TRANSIÇÃO: nem a umidade da Zona da Mata, nem a secura do Sertão. Fica no meio do estado."],
      ["Paisagem","Vegetação mista — resquícios de mata e trechos de caatinga — sobre o Planalto da Borborema."],
      ["Capital do Agreste","Arapiraca, 2ª maior cidade de Alagoas, tradicional capital nacional do fumo e hoje forte em hortifrúti e comércio."],
      ["Outras cidades","Palmeira dos Índios, Girau do Ponciano, São Sebastião, Igaci, Craíbas."],
      ["Economia","Agricultura familiar (fumo, feijão, milho, mandioca), pecuária leiteira, comércio e confecções."],
      ["Bizu","Ordem de LESTE para OESTE: Litoral → Zona da Mata → Agreste → Sertão. É a ordem do mais úmido para o mais seco."]
    ]},
  { id:"mata", nome:"Zona da Mata", cor:"#2E8B3D", lado:"Leste-interior",
    rotulo:[730,430], sub:"cana-de-açúcar",
    resumo:"Massapê, cana-de-açúcar e a Serra da Barriga.",
    itens:[
      ["Onde fica","Faixa logo atrás do litoral, entre o mar e o Agreste."],
      ["Por que 'Mata'","Era o domínio original da Mata Atlântica, derrubada desde o século XVI para dar lugar aos canaviais."],
      ["Solo","Massapê — argiloso, escuro e fértil — o que explica a cana ter se fixado justamente aqui."],
      ["Clima","Tropical úmido, com boas chuvas: é a zona mais chuvosa do estado junto com o litoral."],
      ["História","Aqui fica a SERRA DA BARRIGA, em União dos Palmares, onde se formou o Quilombo dos Palmares."],
      ["Economia","Agroindústria canavieira: açúcar, etanol e as usinas que moldaram a sociedade alagoana."]
    ]},
  { id:"litoral", nome:"Litoral", cor:"#1B9AAA", lado:"Leste",
    rotulo:[862,516], rotAng:56, sub:"praias e a capital", pequeno:true,
    resumo:"Faixa de praias, lagoas e a capital.",
    itens:[
      ["Onde fica","Toda a faixa LESTE, de frente para o Oceano Atlântico — da divisa com Pernambuco, ao norte, à foz do São Francisco, ao sul."],
      ["A capital","Maceió fica aqui, entre o mar e o complexo lagunar Mundaú–Manguaba."],
      ["Norte — Costa dos Corais","Maragogi, Japaratinga, Porto de Pedras e São Miguel dos Milagres: piscinas naturais e a maior APA marinha do país."],
      ["Sul — Costa Dourada","Barra de São Miguel, Praia do Gunga, Coruripe, Piaçabuçu — onde o São Francisco encontra o mar."],
      ["Relevo","Tabuleiros costeiros, falésias, restingas, coqueirais e as lagoas (na verdade lagunas) que deram nome ao estado."],
      ["Economia","Turismo, serviços, porto de Maceió, coco, pesca e o polo de cloro-soda (sal-gema)."]
    ]}
];

/* --- estados vizinhos e o oceano ------------------------ */
const VIZINHOS = [
  { id:"pernambuco", nome:"Pernambuco", cor:"#6A4C93", dir:"N / NO", lado:"Norte e Oeste",
    rotulo:[520,90],
    resumo:"A maior divisa de Alagoas — e o estado de quem ela se separou.",
    itens:[
      ["Direção","Todo o NORTE e o NOROESTE de Alagoas. É a divisa mais extensa do estado, e é feita em TERRA."],
      ["História","Alagoas era a Comarca das Alagoas, parte da Capitania de Pernambuco, até 16 de setembro de 1817."],
      ["Por que se separou","Punição a Pernambuco pela Revolução Pernambucana de 1817 e recompensa à lealdade alagoana. Foi uma Carta Régia de D. João VI."],
      ["Na prova","Se a questão perguntar com quem Alagoas faz divisa ao norte, a resposta é Pernambuco — e só ele."]
    ]},
  { id:"sergipe", nome:"Sergipe", cor:"#B5357A", dir:"S / SE", lado:"Sul",
    rotulo:[596,722],
    resumo:"Vizinho do sul, separado pelo rio São Francisco.",
    itens:[
      ["Direção","Todo o SUL e o SUDESTE, do médio curso do São Francisco até a foz."],
      ["Separado por","O rio São Francisco — divisa natural, não terrestre."],
      ["Travessia","A ponte sobre o São Francisco em Penedo (AL) ⇄ Neópolis (SE) é a principal ligação rodoviária entre os dois estados."],
      ["Foz","O rio desemboca entre Piaçabuçu (AL) e Brejo Grande (SE)."]
    ]},
  { id:"bahia", nome:"Bahia", cor:"#8C6239", dir:"O / SO", lado:"Oeste e Sudoeste",
    rotulo:[100,650],
    resumo:"Vizinho da ponta oeste, no sertão de Xingó.",
    itens:[
      ["Direção","OESTE e SUDOESTE, na ponta mais seca do estado."],
      ["Separado por","Em parte por divisa em terra (Mata Grande, Água Branca, Pariconha) e em parte pelo rio São Francisco / lago de Xingó."],
      ["Marco","É por aqui que o São Francisco entra em Alagoas, formando o cânion e o lago da usina de Xingó."],
      ["Na prova","Alagoas faz divisa com apenas TRÊS estados: Pernambuco (N/NO), Sergipe (S) e Bahia (O/SO)."]
    ]},
  { id:"oceano", nome:"Oceano Atlântico", cor:"#1273AF", dir:"L", lado:"Leste", tipo:"mar",
    resumo:"O limite LESTE de Alagoas.",
    itens:[
      ["Direção","Todo o LESTE do estado. Alagoas tem cerca de 230 km de litoral."],
      ["De onde a onde","Do limite com Pernambuco, ao norte, até a foz do rio São Francisco, ao sul."],
      ["Trechos","Costa dos Corais (norte), região metropolitana de Maceió (centro) e Costa Dourada (sul)."],
      ["Na prova","Leste é sempre o Atlântico. Alagoas não faz divisa com nenhum estado a leste."]
    ]}
];

/* --- águas ---------------------------------------------- */
const AGUAS = [
  { id:"sao-francisco", nome:"Rio São Francisco", tipo:"rio", principal:true,
    d:"M 150 478 L 230 512 L 320 556 L 410 598 L 500 630 L 590 654 L 680 672 L 780 688 L 850 694",
    largura:22, rotulo:[470,640], rotAng:12,
    resumo:"O Velho Chico: divisa sul e fonte de energia e água.",
    itens:[
      ["O que faz em Alagoas","Corre por toda a borda SUL do estado. É a divisa natural de Alagoas com a Bahia (trecho oeste) e com Sergipe (do sertão até o mar)."],
      ["Foz","Deságua no Atlântico entre Piaçabuçu (AL) e Brejo Grande (SE) — o único trecho do estado onde o rio encontra o oceano."],
      ["Energia","Usina Hidrelétrica de Xingó, entre Piranhas (AL) e Canindé de São Francisco (SE). Mais acima, em Delmiro Gouveia, fica a histórica usina de Angiquinho."],
      ["Apelidos","'Velho Chico' e 'rio da integração nacional', por ligar Minas, Bahia, Pernambuco, Alagoas e Sergipe."],
      ["Paisagem","No sertão alagoano forma o Cânion do São Francisco, um dos principais atrativos turísticos do estado."],
      ["Navegação","O trecho Penedo–foz é navegável e foi, por séculos, a porta de entrada do interior alagoano."]
    ]},
  { id:"lagoas", nome:"Lagoas Mundaú e Manguaba", tipo:"laguna",
    pol:[[962,344],[998,354],[1006,382],[988,408],[956,412],[940,384],[944,358]],
    rotulo:[972,382],
    resumo:"O complexo lagunar que deu nome ao estado.",
    itens:[
      ["O nome do estado","'Alagoas' vem justamente destas lagoas. Tecnicamente são LAGUNAS: têm ligação com o mar."],
      ["Quais são","Mundaú (ao norte, junto a Maceió) e Manguaba (ao sul, junto a Marechal Deodoro), ligadas por canais ao Atlântico."],
      ["Complexo Estuarino-Lagunar Mundaú–Manguaba (CELMM)","Área de manguezais e berçário de pescado; sustenta a pesca do sururu, símbolo de Maceió."],
      ["Cultura","Das margens da Mundaú sai o bordado FILÉ, um dos artesanatos mais típicos de Alagoas."],
      ["Rios que as alimentam","Mundaú (que nasce em Pernambuco) e Paraíba do Meio."]
    ]}
];

/* --- divisas em terra ----------------------------------- */
const DIVISAS = [
  { id:"divisa-pe", nome:"Divisa em terra com Pernambuco", tipo:"terra",
    cor:"#6A4C93", vizinho:"pernambuco",
    linha:NORTE, rotulo:[560,215],
    resumo:"Toda a fronteira norte — a maior divisa do estado.",
    itens:[
      ["Extensão","Vai da ponta oeste (Mata Grande) até o litoral norte (Maragogi). Atravessa as quatro zonas do estado."],
      ["Natureza","É divisa SECA, em terra firme, do começo ao fim — diferente do sul, que é rio."],
      ["Por que importa","Foi desta capitania que Alagoas se separou, em 1817. A ligação econômica com a Zona da Mata pernambucana continua forte."],
      ["Bizu","Norte = terra (Pernambuco). Sul = água (rio São Francisco). Leste = água (oceano). Oeste = os dois (Bahia)."]
    ]},
  { id:"divisa-ba", nome:"Divisa com a Bahia (trecho em terra)", tipo:"terra",
    cor:"#8C6239", vizinho:"bahia",
    linha:[[70,430],[128,462],[178,486]], rotulo:[96,486],
    resumo:"O curto trecho seco da ponta oeste.",
    itens:[
      ["Onde fica","Extremo oeste do Sertão: Mata Grande, Água Branca e Pariconha."],
      ["Depois daqui","A divisa com a Bahia passa a ser feita pelo rio São Francisco / lago de Xingó."],
      ["Detalhe de prova","Por isso a Bahia aparece como vizinha 'de terra e de água'. Sergipe é só água; Pernambuco é só terra."]
    ]}
];

/* --- camadas do mapa ------------------------------------ */
const CAMADAS = {
  geo:  { nome:"Geografia",  cor:"#1B9AAA", icone:"▲" },
  hist: { nome:"História",   cor:"#8C3B2E", icone:"◆" },
  eco:  { nome:"Economia",   cor:"#B8860B", icone:"●" },
  cult: { nome:"Cultura",    cor:"#6A4C93", icone:"★" }
};

/* --- pontos: cidades e marcos --------------------------- */
const PONTOS = [
  { id:"maceio", nome:"Maceió — capital", curto:"MACEIÓ", xy:[1010,318], anc:"dir", camadas:["geo","hist","eco"],
    destaque:true, zona:"litoral",
    resumo:"Capital de Alagoas desde 1839.",
    itens:[
      ["Desde quando é capital","9 de dezembro de 1839: lei provincial transferiu a capital da Cidade das Alagoas (hoje Marechal Deodoro) para Maceió, elevada a cidade no mesmo ato."],
      ["Por que mudou","O porto de Jaraguá era mais fundo e movimentado. A capital seguiu o açúcar e o comércio marítimo."],
      ["Onde fica","No litoral, espremida entre o Oceano Atlântico e a lagoa Mundaú."],
      ["População","957.916 habitantes no Censo 2022 — cerca de 30% de todo o estado."],
      ["Economia","Serviços, comércio, turismo, porto de Maceió e o polo de cloro-soda a partir do sal-gema."],
      ["Atualidades","O afundamento do solo nos bairros Pinheiro, Mutange, Bebedouro e Bom Parto, ligado à extração de sal-gema, é tema recorrente de prova."]
    ]},
  { id:"marechal-deodoro", nome:"Marechal Deodoro — 1ª capital", curto:"Marechal Deodoro", xy:[968,424], anc:"dir",
    camadas:["hist","cult"], destaque:true, zona:"litoral",
    resumo:"A primeira capital e o berço do 1º presidente do Brasil.",
    itens:[
      ["Primeira capital","Foi a capital de 1817 (criação da Capitania) até 1839, quando Maceió assumiu. Chamava-se Vila/Cidade das Alagoas."],
      ["O nome de hoje","Recebeu o nome atual em 1939, em homenagem a Manuel Deodoro da Fonseca, nascido ali em 5 de agosto de 1827 — proclamador da República e 1º presidente do Brasil."],
      ["Patrimônio","Conjunto arquitetônico e paisagístico TOMBADO pelo IPHAN: Convento e Igreja de São Francisco, Museu de Arte Sacra, casario colonial."],
      ["Onde fica","Litoral, na margem da lagoa Manguaba, vizinha de Maceió."],
      ["Também alagoano","Floriano Peixoto, 2º presidente, nasceu em Ipioca (hoje Maceió). Alagoas deu ao Brasil os dois primeiros presidentes."]
    ]},
  { id:"uniao-palmares", nome:"União dos Palmares — Serra da Barriga", curto:"União dos Palmares", xy:[792,300], anc:"dir",
    camadas:["hist","cult","geo"], destaque:true, zona:"mata",
    resumo:"Onde ficou o Quilombo dos Palmares.",
    itens:[
      ["O que foi Palmares","O maior e mais duradouro quilombo das Américas, formado no fim do século XVI e ativo por quase cem anos, na Serra da Barriga."],
      ["Onde exatamente","Serra da Barriga, no município de União dos Palmares, Zona da Mata alagoana. Ali ficava o Mocambo do Macaco, a 'capital' de Palmares."],
      ["Por que ali","Serra alta, de difícil acesso, cercada de mata fechada e água — e perto o bastante dos engenhos de onde fugiam os escravizados."],
      ["Zumbi","Nascido em Palmares por volta de 1655, líder a partir de 1680. Morto em 20 de novembro de 1695, na Serra Dois Irmãos."],
      ["Ganga Zumba","Liderou antes de Zumbi e assinou a paz com a Coroa em 1678 — acordo que Zumbi recusou, provocando o racha."],
      ["O fim","O Macaco foi destruído em 1694 pela expedição do bandeirante paulista Domingos Jorge Velho."],
      ["Hoje","Parque Memorial Quilombo dos Palmares, tombado, e o 20 de novembro como Dia Nacional de Zumbi e da Consciência Negra."]
    ]},
  { id:"penedo", nome:"Penedo", xy:[792,664], anc:"dir", camadas:["hist","cult"], zona:"litoral",
    resumo:"Cidade colonial às margens do São Francisco.",
    itens:[
      ["Origem","Uma das povoações mais antigas de Alagoas, ligada a Duarte Coelho e à ocupação portuguesa do baixo São Francisco no século XVI."],
      ["Papel histórico","Porto fluvial e entrada do interior: por ali passavam o gado, o couro e o comércio do rio."],
      ["Patrimônio","Centro histórico TOMBADO pelo IPHAN — casario colonial, Igreja de Nossa Senhora da Corrente, Convento de São Francisco."],
      ["Ligação com Sergipe","Daqui sai a travessia (e a ponte) para Neópolis/SE."]
    ]},
  { id:"piacabucu", nome:"Piaçabuçu — foz do São Francisco", xy:[848,700], anc:"dir",
    camadas:["geo"], zona:"litoral",
    resumo:"Onde o Velho Chico encontra o Atlântico.",
    itens:[
      ["A foz","O rio São Francisco desemboca entre Piaçabuçu (AL) e Brejo Grande (SE)."],
      ["Paisagem","Dunas, restinga, manguezal e a APA de Piaçabuçu — área de desova de tartarugas marinhas."],
      ["Extremo sul","É o ponto mais ao sul do litoral alagoano."]
    ]},
  { id:"piranhas", nome:"Piranhas — Cânion e Xingó", xy:[236,516], anc:"dir",
    camadas:["geo","eco","cult"], zona:"sertao",
    resumo:"Cânion do São Francisco e a usina de Xingó.",
    itens:[
      ["Cânion do São Francisco","Paredões de até 170 m sobre o lago de Xingó — o principal cartão-postal do sertão alagoano."],
      ["Usina de Xingó","A hidrelétrica fica entre Piranhas (AL) e Canindé de São Francisco (SE), operada pela Chesf."],
      ["Patrimônio","O núcleo histórico de Piranhas, da época da navegação a vapor no rio, é tombado."],
      ["Lampião","Foi na região, na Grota do Angico (já em Sergipe, perto daqui), que o cangaceiro Lampião foi morto em 1938. O Museu do Sertão fica em Piranhas."]
    ]},
  { id:"delmiro", nome:"Delmiro Gouveia — Angiquinho", xy:[196,468], anc:"dir",
    camadas:["eco","hist"], zona:"sertao",
    resumo:"A primeira hidrelétrica do Nordeste.",
    itens:[
      ["Quem foi Delmiro","Delmiro Gouveia, empresário pernambucano radicado no sertão alagoano, pioneiro da industrialização no Nordeste."],
      ["Angiquinho","Construiu em 1913, na cachoeira de Paulo Afonso, a usina hidrelétrica de Angiquinho — a PRIMEIRA hidrelétrica do Nordeste."],
      ["A fábrica","Com essa energia tocou a Fábrica de Linhas Estrela, na então Pedra, que virou uma vila operária modelo."],
      ["Fim","Foi assassinado em 1917. A cidade leva seu nome desde 1952."]
    ]},
  { id:"arapiraca", nome:"Arapiraca", xy:[556,468], anc:"dir", camadas:["geo","eco"], zona:"agreste",
    resumo:"A capital do Agreste e 2ª maior cidade do estado.",
    itens:[
      ["Tamanho","Segunda maior cidade de Alagoas em população, depois de Maceió."],
      ["Fumo","Foi por décadas a capital nacional do fumo — o cultivo moldou a economia e a paisagem do Agreste."],
      ["Hoje","Diversificou para hortifrúti, comércio regional, confecções e serviços; é o principal polo do interior."],
      ["Onde fica","Centro do estado, coração do Agreste alagoano."]
    ]},
  { id:"palmeira", nome:"Palmeira dos Índios", xy:[466,414], anc:"dir", camadas:["cult","geo"], zona:"agreste",
    resumo:"Cidade de Graciliano Ramos, no Agreste.",
    itens:[
      ["Graciliano Ramos","Foi prefeito daqui (1928–1930). Os relatórios que escreveu à época ficaram célebres pela secura do estilo. É o maior escritor alagoano."],
      ["Nome","Lembra a presença indígena Xukuru-Kariri, que permanece na região."],
      ["Onde fica","Agreste, no caminho entre a Zona da Mata e o Sertão."]
    ]},
  { id:"santana", nome:"Santana do Ipanema", xy:[330,424], anc:"dir", camadas:["geo"], zona:"sertao",
    resumo:"Principal cidade do sertão central alagoano.",
    itens:[
      ["Onde fica","Sertão, às margens do rio Ipanema, afluente do São Francisco."],
      ["Papel","Polo de serviços e comércio para os municípios do semiárido alagoano."]
    ]},
  { id:"mata-grande", nome:"Mata Grande — Serra da Onça", curto:"Mata Grande", xy:[172,414], anc:"dir",
    camadas:["geo"], zona:"sertao",
    resumo:"O ponto mais alto de Alagoas.",
    itens:[
      ["Ponto culminante","Serra da Onça, em Mata Grande: cerca de 1.016 m — a maior altitude do estado."],
      ["Clima de exceção","Apesar de estar no sertão, a altitude garante temperaturas amenas: é um 'brejo de altitude' dentro do semiárido."],
      ["Divisa","Município do extremo oeste, na divisa em terra com Pernambuco e Bahia."]
    ]},
  { id:"maragogi", nome:"Maragogi — Costa dos Corais", xy:[1046,180], anc:"esq",
    camadas:["eco","geo"], zona:"litoral",
    resumo:"As galés e o principal destino do litoral norte.",
    itens:[
      ["Piscinas naturais","As Galés de Maragogi, a cerca de 6 km da costa, dentro da APA Costa dos Corais."],
      ["APA Costa dos Corais","Maior área de proteção marinha do Brasil, do norte de Alagoas ao sul de Pernambuco."],
      ["Rota Ecológica","O trecho São Miguel dos Milagres–Porto de Pedras–Japaratinga, ao sul daqui, é um dos roteiros turísticos mais valorizados do estado."],
      ["Divisa","Município do extremo norte do litoral, já na divisa com Pernambuco."]
    ]},
  { id:"sao-miguel", nome:"São Miguel dos Milagres", curto:"S. Miguel dos Milagres", xy:[1046,244], anc:"esq",
    camadas:["eco"], zona:"litoral",
    resumo:"Coração da Rota Ecológica.",
    itens:[
      ["Turismo","Polo de pousadas de charme e turismo de alto padrão, com recifes e coqueirais."],
      ["Peixe-boi","A região abriga projetos de proteção do peixe-boi marinho, espécie ameaçada."]
    ]},
  { id:"porto-calvo", nome:"Porto Calvo", xy:[930,214], anc:"esq", camadas:["hist"], zona:"mata",
    resumo:"Palco das guerras holandesas em Alagoas.",
    itens:[
      ["Invasões holandesas","A região foi disputada na ocupação neerlandesa do Nordeste (1630–1654); Porto Calvo foi cenário de combates decisivos."],
      ["Calabar","Foi aqui que Domingos Fernandes Calabar, acusado de traição por servir aos holandeses, foi executado em 1635."],
      ["Açúcar","Um dos núcleos mais antigos da economia açucareira alagoana."]
    ]},
  { id:"coruripe", nome:"Coruripe", xy:[940,578], anc:"dir", camadas:["eco"], zona:"litoral",
    resumo:"Cana, coco e praia no litoral sul.",
    itens:[
      ["Agroindústria","Sede de um dos maiores grupos sucroalcooleiros do país."],
      ["Litoral sul","Praias de Pontal do Coruripe e Lagoa do Pau, na Costa Dourada."]
    ]},
  { id:"quebrangulo", nome:"Quebrangulo", xy:[690,352], anc:"dir", camadas:["cult"], zona:"mata",
    resumo:"Onde nasceu Graciliano Ramos.",
    itens:[
      ["Graciliano Ramos","Nasceu aqui em 27 de outubro de 1892. Autor de 'Vidas Secas', 'São Bernardo' e 'Memórias do Cárcere'."],
      ["Natureza","Abriga a Reserva Biológica de Pedra Talhada, remanescente importante de Mata Atlântica."]
    ]},
  { id:"barra-sao-miguel", nome:"Barra de São Miguel / Praia do Gunga", curto:"Barra de São Miguel", xy:[980,478], anc:"dir",
    camadas:["eco"], zona:"litoral",
    resumo:"Cartão-postal do litoral sul.",
    itens:[
      ["Praia do Gunga","Onde a lagoa do Roteiro encontra o mar — uma das paisagens mais fotografadas de Alagoas."],
      ["Turismo","Integra a Costa Dourada, ao sul de Maceió."]
    ]}
];

/* --- síntese: divisas por direção ----------------------- */
const LIMITES = [
  ["Norte e Noroeste","Pernambuco","Divisa em TERRA (a mais extensa do estado)"],
  ["Leste","Oceano Atlântico","Cerca de 230 km de litoral"],
  ["Sul e Sudeste","Sergipe","Rio São Francisco"],
  ["Oeste e Sudoeste","Bahia","Divisa em terra + rio São Francisco / lago de Xingó"]
];

/* --- cartão de identidade ------------------------------- */
const IDENTIDADE = [
  ["Capital","Maceió (desde 1839)"],
  ["Municípios","102"],
  ["Área","27.830,66 km² — o 2º MENOR estado do Brasil, atrás só de Sergipe"],
  ["População","3.127.683 habitantes (Censo IBGE 2022)"],
  ["Região","Nordeste"],
  ["Emancipação","16 de setembro de 1817 (separação de Pernambuco)"],
  ["Província","28 de fevereiro de 1821"],
  ["Ponto mais alto","Serra da Onça, em Mata Grande — cerca de 1.016 m"],
  ["Divisas","Pernambuco, Sergipe e Bahia (apenas 3 estados)"],
  ["Gentílico","alagoano"]
];
