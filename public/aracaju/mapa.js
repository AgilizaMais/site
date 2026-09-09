/* =========================================================
   Desenho e interação do mapa de Aracaju
   ========================================================= */
const SVGNS = "http://www.w3.org/2000/svg";
const VIEW = { x:0, y:0, w:900, h:1400 };
const VIEW0 = { ...VIEW };

/* contorno do continente (tudo que não é oceano) */
const CONTINENTE = [
  [0,0],[300,0],[380,120],[440,235],[520,340],[592,402],[642,470],[664,548],
  [660,600],[648,700],[634,800],[618,910],[600,1020],[580,1140],[556,1262],[530,1400],[0,1400]
];

const svg = document.getElementById("mapa");
const tip = document.getElementById("tip");
const camadas = {};

function el(tag, attrs, pai){
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  (pai || svg).appendChild(n);
  return n;
}
function pts(arr){ return arr.map(p => p[0] + "," + p[1]).join(" "); }

/* célula da malha -> polígono */
function celula(rTop, rBot, c0, c1){
  const top = MALHA[rTop], bot = MALHA[rBot], p = [];
  for (let c = c0; c <= c1; c++) p.push(top[c]);
  for (let c = c1; c >= c0; c--) p.push(bot[c]);
  return p;
}
function centro(p){
  let x = 0, y = 0;
  p.forEach(q => { x += q[0]; y += q[1]; });
  return [x / p.length, y / p.length];
}
function area(p){
  let a = 0;
  for (let i = 0; i < p.length; i++){
    const j = (i + 1) % p.length;
    a += p[i][0] * p[j][1] - p[j][0] * p[i][1];
  }
  return Math.abs(a / 2);
}

/* ---------- registro de tudo que é clicável ---------- */
const REGISTRO = {};

function registrar(node, dado){
  REGISTRO[dado.id] = dado;
  node.classList.add("alvo");
  node.setAttribute("tabindex", "0");
  node.setAttribute("role", "button");
  node.setAttribute("aria-label", dado.nome);
  node.dataset.id = dado.id;
  node.addEventListener("mouseenter", e => mostrarTip(e, dado));
  node.addEventListener("mousemove", e => posTip(e));
  node.addEventListener("mouseleave", esconderTip);
  node.addEventListener("click", () => abrirModal(dado));
  node.addEventListener("focus", () => destacar(dado.id, true));
  node.addEventListener("blur", () => destacar(dado.id, false));
  node.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirModal(dado); }
  });
}

/* ---------- desenho ---------- */
function desenhar(){
  ["mar","terra","vizinhos","bairros","aguas","rotulos","pontos","enfeites"]
    .forEach(n => camadas[n] = el("g", { class: "camada-" + n }));

  /* oceano = fundo */
  const mar = el("rect", { x:-50, y:-50, width:1000, height:1500, class:"mar", id:"f-oceano" }, camadas.mar);
  registrar(mar, Object.assign({ zona:"agua" }, AGUAS.find(a => a.id === "oceano")));

  /* continente */
  el("polygon", { points: pts(CONTINENTE), class:"terra-base" }, camadas.terra);

  /* municípios vizinhos */
  VIZINHOS.forEach(v => {
    const g = el("g", { class:"grupo" }, camadas.vizinhos);
    const p = el("polygon", {
      points: pts(v.pol), class:"vizinho", id:"f-" + v.id,
      style:"--cor:" + v.cor
    }, g);
    registrar(p, Object.assign({ zona:"vizinho" }, v));

    const [rx, ry] = v.rotulo;
    const gr = el("g", { class:"rot-mun", id:"r-" + v.id }, camadas.rotulos);
    const selo = el("text", { x:rx, y:ry - 22, class:"selo-dir" }, gr);
    selo.textContent = v.dir;
    const t = el("text", { x:rx, y:ry + 4, class:"rot-vizinho" }, gr);
    quebrar(t, v.nome, rx, ry + 4, 17);
  });

  /* bairros de Aracaju */
  AREAS.forEach(a => {
    const poly = celula(a.cel[0], a.cel[1], a.cel[2], a.cel[3]);
    a._pol = poly;
    const n = el("polygon", {
      points: pts(poly),
      class: "bairro z-" + a.zona,
      id: "f-" + a.id,
      style: "--cor:" + ZONAS[a.zona].cor
    }, camadas.bairros);
    registrar(n, a);

    const c = centro(poly);
    a._c = c;
    const grande = area(poly) > 5200;
    const t = el("text", {
      x:c[0], y:c[1], class:"rot-bairro" + (grande ? "" : " rot-mini"),
      id:"r-" + a.id
    }, camadas.rotulos);
    quebrar(t, (a.estrela ? "★ " : "") + (a.curto || a.nome.split(" — ")[0]), c[0], c[1], grande ? 13 : 11);
  });

  /* rios */
  AGUAS.filter(a => a.tipo === "rio").forEach(r => {
    const g = el("g", { class:"grupo" }, camadas.aguas);
    el("path", { d:r.d, class:"rio-borda", "stroke-width": r.largura + 6 }, g);
    const p = el("path", { d:r.d, class:"rio", "stroke-width": r.largura, id:"f-" + r.id }, g);
    registrar(p, Object.assign({ zona:"agua" }, r));
    const t = el("text", {
      x:r.rotulo[0], y:r.rotulo[1], class:"rot-rio",
      transform:`rotate(${r.rotAng || 0} ${r.rotulo[0]} ${r.rotulo[1]})`
    }, camadas.rotulos);
    t.textContent = r.nome;
  });

  /* pontes e marcos */
  PONTOS.forEach(p => {
    const g = el("g", { class:"grupo ponto p-" + p.tipo, id:"f-" + p.id }, camadas.pontos);
    if (p.tipo === "ponte"){
      el("rect", { x:p.xy[0]-11, y:p.xy[1]-11, width:22, height:22, rx:5, class:"pino pino-ponte" }, g);
      el("path", {
        d:`M ${p.xy[0]-6} ${p.xy[1]+3} q 6 -9 12 0 M ${p.xy[0]-6} ${p.xy[1]+3} v 4 M ${p.xy[0]+6} ${p.xy[1]+3} v 4`,
        class:"icone"
      }, g);
    } else {
      el("circle", { cx:p.xy[0], cy:p.xy[1], r:11, class:"pino pino-marco" }, g);
      el("circle", { cx:p.xy[0], cy:p.xy[1], r:4, class:"icone-cheio" }, g);
    }
    const texto = p.curto !== undefined ? p.curto : p.nome.split(" — ")[0];
    if (texto){
      const dx = p.lado === "esq" ? -16 : 16;
      const t = el("text", {
        x:p.xy[0]+dx, y:p.xy[1]+4,
        class:"rot-ponto " + (p.lado === "esq" ? "fim" : "inicio") +
              (p.id === "marco-zero" ? " rot-marco" : "")
      }, camadas.rotulos);
      t.textContent = texto;
    }
    registrar(g, p);
  });

  const oc = el("text", { x:800, y:900, class:"rot-oceano",
    transform:"rotate(90 800 900)" }, camadas.rotulos);
  oc.textContent = "OCEANO ATLÂNTICO";
  const ocd = el("text", { x:846, y:900, class:"selo-dir selo-mar",
    transform:"rotate(90 846 900)" }, camadas.rotulos);
  ocd.textContent = "LESTE";

  bussola();
}

/* rótulo com quebra de linha */
function quebrar(t, texto, x, y, tam){
  const palavras = texto.split(" ");
  const linhas = [];
  let atual = "";
  palavras.forEach(p => {
    if ((atual + " " + p).trim().length > 16 && atual){ linhas.push(atual); atual = p; }
    else atual = (atual + " " + p).trim();
  });
  if (atual) linhas.push(atual);
  const alt = tam * 1.05;
  const y0 = y - ((linhas.length - 1) * alt) / 2;
  linhas.forEach((l, i) => {
    const ts = el("tspan", { x, y: y0 + i * alt }, t);
    ts.textContent = l;
  });
}

/* rosa dos ventos */
function bussola(){
  const g = el("g", { class:"bussola" }, camadas.enfeites);
  const cx = 795, cy = 1250, r = 46;
  el("circle", { cx, cy, r, class:"bussola-fundo" }, g);
  el("path", { d:`M ${cx} ${cy-r+6} L ${cx+11} ${cy} L ${cx} ${cy+r-6} L ${cx-11} ${cy} Z`, class:"bussola-agulha" }, g);
  const rot = [["N",cx,cy-r-6],["S",cx,cy+r+16],["L",cx+r+12,cy+5],["O",cx-r-12,cy+5]];
  rot.forEach(([txt,x,y]) => {
    const t = el("text", { x, y, class:"bussola-txt" }, g);
    t.textContent = txt;
  });
}

/* ---------- tooltip ---------- */
function mostrarTip(e, d){
  const z = ZONAS[d.zona || "vizinho"];
  tip.innerHTML =
    `<span class="tip-zona" style="background:${d.cor || (z ? z.cor : "#888")}">${d.lado ? "Limite " + d.lado : (z ? z.nome : "")}</span>` +
    `<strong>${d.nome}</strong><span class="tip-txt">${d.resumo || ""}</span>` +
    `<span class="tip-dica">clique para abrir os detalhes</span>`;
  tip.classList.add("ver");
  posTip(e);
  destacar(d.id, true);
}
function posTip(e){
  const m = 16;
  let x = e.clientX + m, y = e.clientY + m;
  const c = tip.getBoundingClientRect();
  if (x + c.width > window.innerWidth - 8) x = e.clientX - c.width - m;
  if (y + c.height > window.innerHeight - 8) y = e.clientY - c.height - m;
  tip.style.left = x + "px";
  tip.style.top = y + "px";
}
function esconderTip(){
  tip.classList.remove("ver");
  document.querySelectorAll(".ativo").forEach(n => n.classList.remove("ativo"));
}
function destacar(id, on){
  const n = document.getElementById("f-" + id);
  if (n) n.classList.toggle("ativo", on);
}

/* ---------- modal ---------- */
const modal    = document.getElementById("modal");
const mCaixa   = document.getElementById("modal-caixa");
const mTitulo  = document.getElementById("modal-titulo");
const mZona    = document.getElementById("modal-zona");
const mResumo  = document.getElementById("modal-resumo");
const mCorpo   = document.getElementById("modal-corpo");
const mVizinho = document.getElementById("modal-vizinhos");

function abrirModal(d){
  esconderTip();
  const z = ZONAS[d.zona || "vizinho"];
  mTitulo.textContent = d.nome;
  mZona.textContent = d.lado ? "Limite " + d.lado : (z ? z.nome : "");
  mZona.style.background = d.cor || (z ? z.cor : "#888");
  mResumo.textContent = d.resumo || "";
  mCorpo.innerHTML = "";
  (d.itens || []).forEach(([h, p]) => {
    const bloco = document.createElement("div");
    bloco.className = "linha";
    bloco.innerHTML = `<h4>${h}</h4><p>${p}</p>`;
    mCorpo.appendChild(bloco);
  });
  mVizinho.innerHTML = "";
  vizinhosDe(d).forEach(v => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip-vizinho";
    b.style.setProperty("--cor", ZONAS[v.zona || "vizinho"].cor);
    b.textContent = v.nome.split(" — ")[0];
    b.addEventListener("click", () => abrirModal(v));
    mVizinho.appendChild(b);
  });
  modal.classList.add("ver");
  document.body.classList.add("travado");
  mCaixa.focus();
}
function fecharModal(){
  modal.classList.remove("ver");
  document.body.classList.remove("travado");
}
modal.addEventListener("click", e => { if (e.target === modal) fecharModal(); });
document.getElementById("modal-fechar").addEventListener("click", fecharModal);
document.addEventListener("keydown", e => { if (e.key === "Escape") fecharModal(); });

/* vizinhança simples: distância entre centroides */
function vizinhosDe(d){
  if (!d._c) return [];
  return AREAS
    .filter(a => a.id !== d.id)
    .map(a => ({ a, dist: Math.hypot(a._c[0]-d._c[0], a._c[1]-d._c[1]) }))
    .sort((x, y) => x.dist - y.dist)
    .slice(0, 4)
    .map(o => o.a);
}

/* ---------- legenda: municípios (foco) + zonas ---------- */
let foco = null; /* {tipo:"mun"|"zona", id} */

function montarLegenda(){
  const cxM = document.getElementById("legenda-mun");
  const alvos = [
    ...VIZINHOS.map(v => ({ id:v.id, nome:v.nome, dir:v.dir, cor:v.cor })),
    (() => { const o = AGUAS.find(a => a.id === "oceano");
             return { id:o.id, nome:o.nome, dir:o.dir, cor:o.cor }; })()
  ];
  alvos.forEach(a => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip chip-mun";
    b.dataset.alvo = a.id;
    b.style.setProperty("--cor", a.cor);
    b.innerHTML = `<i></i><b>${a.dir}</b> ${a.nome}`;
    b.addEventListener("click", () => alternarFoco("mun", a.id, b));
    cxM.appendChild(b);
  });

  const cxZ = document.getElementById("legenda-zona");
  ["norte","centro","oeste","sul","expansao"].forEach(id => {
    const z = ZONAS[id];
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip chip-zona";
    b.dataset.alvo = id;
    b.style.setProperty("--cor", z.cor);
    b.innerHTML = `<i></i>${z.nome}`;
    b.addEventListener("click", () => alternarFoco("zona", id, b));
    cxZ.appendChild(b);
  });

  const bt = document.getElementById("modo-zonas");
  bt.addEventListener("click", () => {
    const on = document.body.classList.toggle("modo-zonas");
    bt.classList.toggle("on", on);
    bt.textContent = on ? "Colorir bairros: ligado" : "Colorir bairros por zona";
    document.getElementById("legenda-zona").hidden = !on;
    if (!on && foco && foco.tipo === "zona") limparFoco();
  });
}

function limparFoco(){
  foco = null;
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("on"));
  document.querySelectorAll(".apagado, .foco").forEach(n => n.classList.remove("apagado", "foco"));
  svg.classList.remove("filtrando");
}

function alternarFoco(tipo, id, botao){
  if (foco && foco.tipo === tipo && foco.id === id) { limparFoco(); return; }
  limparFoco();
  foco = { tipo, id };
  botao.classList.add("on");
  svg.classList.add("filtrando");

  const apagar = n => n && n.classList.add("apagado");
  const focar  = n => n && n.classList.add("foco");

  if (tipo === "mun"){
    /* municípios: apaga os bairros e os outros vizinhos */
    AREAS.forEach(a => { apagar(document.getElementById("f-" + a.id));
                         apagar(document.getElementById("r-" + a.id)); });
    VIZINHOS.forEach(v => {
      const alvo = v.id === id;
      if (alvo) { focar(document.getElementById("f-" + v.id)); }
      else { apagar(document.getElementById("f-" + v.id));
             apagar(document.getElementById("r-" + v.id)); }
    });
    if (id === "oceano"){
      document.querySelector(".camada-terra").classList.add("apagado");
      document.querySelectorAll(".camada-vizinhos .vizinho, .rot-mun")
        .forEach(n => n.classList.add("apagado"));
      document.querySelector(".rot-oceano").classList.add("foco");
    }
  } else {
    /* zonas: apaga os bairros das outras zonas */
    AREAS.forEach(a => {
      if (a.zona === id) return;
      apagar(document.getElementById("f-" + a.id));
      apagar(document.getElementById("r-" + a.id));
    });
    document.querySelectorAll(".camada-vizinhos .vizinho, .rot-mun")
      .forEach(n => n.classList.add("apagado"));
  }
}

/* ---------- busca ---------- */
function montarBusca(){
  const campo = document.getElementById("busca");
  const lista = document.getElementById("busca-lista");
  const tudo = [...AREAS, ...AGUAS, ...VIZINHOS, ...PONTOS];
  campo.addEventListener("input", () => {
    const q = campo.value.trim().toLowerCase();
    lista.innerHTML = "";
    if (q.length < 2) { lista.classList.remove("ver"); return; }
    const achados = tudo.filter(d => d.nome.toLowerCase().includes(q)).slice(0, 8);
    achados.forEach(d => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = d.nome;
      b.addEventListener("click", () => {
        campo.value = "";
        lista.classList.remove("ver");
        abrirModal(REGISTRO[d.id] || d);
      });
      lista.appendChild(b);
    });
    lista.classList.toggle("ver", achados.length > 0);
  });
  document.addEventListener("click", e => {
    if (!e.target.closest(".busca")) lista.classList.remove("ver");
  });
}

/* ---------- zoom e arrasto ---------- */
function aplicarView(){
  svg.setAttribute("viewBox", `${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`);
}
function zoom(fator, cx, cy){
  const nw = Math.min(VIEW0.w, Math.max(VIEW0.w * 0.28, VIEW.w * fator));
  const k = nw / VIEW.w;
  VIEW.x = cx - (cx - VIEW.x) * k;
  VIEW.y = cy - (cy - VIEW.y) * k;
  VIEW.w = nw;
  VIEW.h = VIEW0.h * (nw / VIEW0.w);
  limitar();
  aplicarView();
}
function limitar(){
  VIEW.x = Math.min(Math.max(VIEW.x, -40), VIEW0.w - VIEW.w + 40);
  VIEW.y = Math.min(Math.max(VIEW.y, -40), VIEW0.h - VIEW.h + 40);
}
function paraSVG(e){
  const r = svg.getBoundingClientRect();
  return [
    VIEW.x + ((e.clientX - r.left) / r.width) * VIEW.w,
    VIEW.y + ((e.clientY - r.top) / r.height) * VIEW.h
  ];
}
function ligarNavegacao(){
  document.getElementById("zoom-mais").addEventListener("click", () => zoom(0.75, VIEW.x + VIEW.w/2, VIEW.y + VIEW.h/2));
  document.getElementById("zoom-menos").addEventListener("click", () => zoom(1.33, VIEW.x + VIEW.w/2, VIEW.y + VIEW.h/2));
  document.getElementById("zoom-reset").addEventListener("click", () => {
    Object.assign(VIEW, VIEW0); aplicarView();
  });
  svg.addEventListener("wheel", e => {
    e.preventDefault();
    const [x, y] = paraSVG(e);
    zoom(e.deltaY > 0 ? 1.12 : 0.89, x, y);
  }, { passive:false });

  let arrastando = false, ini = null, viewIni = null, moveu = 0;
  svg.addEventListener("pointerdown", e => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    arrastando = true; moveu = 0;
    ini = paraSVG(e); viewIni = { x:VIEW.x, y:VIEW.y };
  });
  document.addEventListener("pointermove", e => {
    if (!arrastando) return;
    const r = svg.getBoundingClientRect();
    const atual = [
      viewIni.x + ((e.clientX - r.left) / r.width) * VIEW.w,
      viewIni.y + ((e.clientY - r.top) / r.height) * VIEW.h
    ];
    const dx = ini[0] - atual[0], dy = ini[1] - atual[1];
    moveu = Math.max(moveu, Math.abs(dx) + Math.abs(dy));
    if (moveu <= 6) return;
    svg.classList.add("arrastando");
    esconderTip();
    VIEW.x = viewIni.x + dx; VIEW.y = viewIni.y + dy;
    limitar(); aplicarView();
  });
  document.addEventListener("pointerup", () => {
    arrastando = false;
    svg.classList.remove("arrastando");
    setTimeout(() => { moveu = 0; }, 0);
  });
  svg.addEventListener("click", e => { if (moveu > 6) e.stopPropagation(); }, true);
}

/* ---------- tabela de limites ---------- */
function montarLimites(){
  const t = document.getElementById("tab-limites");
  LIMITES.forEach(([lado, quem, sep]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><b>${lado}</b></td><td>${quem}</td><td>${sep}</td>`;
    t.appendChild(tr);
  });
}

/* ---------- rosa dos ventos ---------- */
function montarRosa(){
  const cx = document.getElementById("rosa");
  const V = id => VIZINHOS.find(v => v.id === id);
  const mar = AGUAS.find(a => a.id === "oceano");
  const cel = (ponto, dados, quem, sep) => {
    const d = document.createElement("button");
    d.type = "button";
    d.className = "cel";
    d.style.setProperty("--cor", dados ? dados.cor : "#888");
    d.innerHTML = `<span class="ponto">${ponto}</span>${quem}<small>${sep}</small>`;
    if (dados) d.addEventListener("click", () => abrirModal(REGISTRO[dados.id] || dados));
    cx.appendChild(d);
  };
  const vazio = txt => {
    const d = document.createElement("div");
    d.className = "cel vazio"; d.textContent = txt; cx.appendChild(d);
  };

  vazio("NO");
  cel("NORTE", V("socorro"), "N. S. do Socorro<br>Santo Amaro das Brotas", "rio do Sal");
  cel("NORDESTE", V("barra-dos-coqueiros"), "Barra dos Coqueiros", "rio Sergipe");

  cel("OESTE", V("sao-cristovao"), "São Cristóvão<br>N. S. do Socorro", "divisa em terra");
  const meio = document.createElement("div");
  meio.className = "cel miolo"; meio.textContent = "ARACAJU"; cx.appendChild(meio);
  cel("LESTE", mar, "Oceano Atlântico", "faixa litorânea");

  vazio("SO");
  cel("SUL", V("itaporanga"), "São Cristóvão<br>Itaporanga d'Ajuda", "rio Vaza-Barris");
  vazio("SE");
}

/* ---------- início ---------- */
desenhar();
aplicarView();
montarLegenda();
montarBusca();
ligarNavegacao();
montarLimites();
montarRosa();
