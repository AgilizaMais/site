/* =========================================================
   Desenho e interação do mapa de Alagoas
   ========================================================= */
const SVGNS = "http://www.w3.org/2000/svg";
const VIEW  = { x:0, y:0, w:1200, h:780 };
const VIEW0 = { ...VIEW };

const svg = document.getElementById("mapa");
const tip = document.getElementById("tip");
const camadas = {};
const REGISTRO = {};

function el(tag, attrs, pai){
  const n = document.createElementNS(SVGNS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  (pai || svg).appendChild(n);
  return n;
}
const pts = arr => arr.map(p => p[0] + "," + p[1]).join(" ");
const dDe = arr => "M " + arr.map(p => p[0] + " " + p[1]).join(" L ");
const inv = arr => arr.slice().reverse();

/* ---------- registro de alvos ---------- */
function registrar(node, dado){
  REGISTRO[dado.id] = dado;
  node.classList.add("alvo");
  node.setAttribute("tabindex", "0");
  node.setAttribute("role", "button");
  node.setAttribute("aria-label", dado.nome);
  node.addEventListener("mouseenter", e => mostrarTip(e, dado));
  node.addEventListener("mousemove", posTip);
  node.addEventListener("mouseleave", esconderTip);
  node.addEventListener("click", () => abrirModal(dado));
  node.addEventListener("focus", () => destacar(dado.id, true));
  node.addEventListener("blur",  () => destacar(dado.id, false));
  node.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirModal(dado); }
  });
}

/* ---------- desenho ---------- */
function poligonoZona(id){
  const iN = { sertao:[0,4], agreste:[4,6], mata:[6,8], litoral:[8,10] }[id];
  const iS = { sertao:[0,4], agreste:[4,7], mata:[7,9], litoral:[9,10] }[id];
  const linhas = { sertao:[null,LIN_SA], agreste:[LIN_SA,LIN_AM],
                   mata:[LIN_AM,LIN_ML], litoral:[LIN_ML,null] }[id];
  let p = NORTE.slice(iN[0], iN[1] + 1);
  if (id === "litoral") p = p.concat(COSTA.slice(1));
  else p = p.concat(linhas[1].slice(1));
  p = p.concat(inv(SUL.slice(iS[0], iS[1] + 1)).slice(1));
  if (linhas[0]) p = p.concat(inv(linhas[0]).slice(1, -1));
  return p;
}

function desenhar(){
  ["mar","vizinhos","zonas","aguas","divisas","rotulos","pontos","enfeites"]
    .forEach(n => camadas[n] = el("g", { class:"camada-" + n }));

  /* oceano = fundo */
  const mar = el("rect", { x:-60, y:-60, width:1320, height:900, class:"mar", id:"f-oceano" }, camadas.mar);
  registrar(mar, VIZINHOS.find(v => v.id === "oceano"));

  /* estados vizinhos */
  const polVizinho = {
    pernambuco: [[0,0],[1130,0],[1046,120]].concat(inv(NORTE).slice(1)).concat([[0,430]]),
    sergipe:    [SUL[2]].concat(SUL.slice(3)).concat([[830,780],[200,780]]),
    bahia:      [[70,430],[128,462],[196,492],[200,780],[0,780],[0,430]]
  };
  VIZINHOS.filter(v => v.tipo !== "mar").forEach(v => {
    const p = el("polygon", { points:pts(polVizinho[v.id]), class:"vizinho",
                              id:"f-" + v.id, style:"--cor:" + v.cor }, camadas.vizinhos);
    registrar(p, v);
    const g = el("g", { class:"rot-mun", id:"r-" + v.id }, camadas.rotulos);
    const s = el("text", { x:v.rotulo[0], y:v.rotulo[1] - 21, class:"selo-dir" }, g);
    s.textContent = v.dir;
    const t = el("text", { x:v.rotulo[0], y:v.rotulo[1] + 4, class:"rot-vizinho" }, g);
    t.textContent = v.nome;
  });

  /* as quatro zonas */
  ZONAS.forEach(z => {
    const p = el("polygon", { points:pts(poligonoZona(z.id)), class:"zona",
                              id:"f-" + z.id, style:"--cor:" + z.cor }, camadas.zonas);
    registrar(p, z);
    const rot = z.rotAng ? `rotate(${z.rotAng} ${z.rotulo[0]} ${z.rotulo[1]})` : null;
    const g = el("g", { class:"rot-zona-g", id:"r-" + z.id }, camadas.rotulos);
    if (rot) g.setAttribute("transform", rot);
    const t = el("text", { x:z.rotulo[0], y:z.rotulo[1],
      class:"rot-zona" + (z.pequeno ? " rot-zona-p" : "") }, g);
    t.textContent = z.nome.toUpperCase();
    const s = el("text", { x:z.rotulo[0], y:z.rotulo[1] + 19, class:"rot-zona-sub" }, g);
    s.textContent = z.sub || "";
  });

  /* lagoas e rios */
  AGUAS.forEach(a => {
    const g = el("g", { class:"grupo" }, camadas.aguas);
    if (a.tipo === "rio"){
      el("path", { d:a.d, class:"rio-borda", "stroke-width":a.largura + 7 }, g);
      const p = el("path", { d:a.d, class:"rio" + (a.principal ? " rio-forte" : ""),
                             "stroke-width":a.largura, id:"f-" + a.id }, g);
      registrar(p, a);
      const t = el("text", { x:a.rotulo[0], y:a.rotulo[1], class:"rot-rio",
        transform:`rotate(${a.rotAng || 0} ${a.rotulo[0]} ${a.rotulo[1]})` }, camadas.rotulos);
      t.textContent = a.nome;
    } else {
      const p = el("polygon", { points:pts(a.pol), class:"laguna", id:"f-" + a.id }, g);
      registrar(p, a);
      const t = el("text", { x:a.rotulo[0], y:a.rotulo[1], class:"rot-laguna" }, camadas.rotulos);
      t.textContent = "Mundaú / Manguaba";
    }
  });

  /* divisas em terra */
  DIVISAS.forEach(v => {
    const g = el("g", { class:"grupo divisa", id:"f-" + v.id, style:"--cor:" + v.cor }, camadas.divisas);
    const d = dDe(v.linha);
    el("path", { d, class:"divisa-halo" }, g);
    el("path", { d, class:"divisa-base" }, g);
    el("path", { d, class:"divisa-traco" }, g);
    registrar(g, v);
    const t = el("text", { x:v.rotulo[0], y:v.rotulo[1], class:"rot-divisa" }, camadas.rotulos);
    t.textContent = "DIVISA EM TERRA";
  });

  /* cidades e marcos */
  PONTOS.forEach(p => {
    const g = el("g", { class:"grupo ponto" + (p.destaque ? " destaque" : ""),
                        id:"f-" + p.id, "data-camadas":p.camadas.join(" ") }, camadas.pontos);
    const r = p.destaque ? 11 : 7;
    el("circle", { cx:p.xy[0], cy:p.xy[1], r:r + 4, class:"pino-halo" }, g);
    el("circle", { cx:p.xy[0], cy:p.xy[1], r, class:"pino" }, g);
    if (p.destaque) el("circle", { cx:p.xy[0], cy:p.xy[1], r:4, class:"pino-miolo" }, g);
    registrar(g, p);

    const dx = p.anc === "esq" ? -(r + 9) : (r + 9);
    const t = el("text", { x:p.xy[0] + dx, y:p.xy[1] + 4,
      class:"rot-ponto " + (p.anc === "esq" ? "fim" : "inicio") + (p.destaque ? " forte" : ""),
      id:"rp-" + p.id, "data-camadas":p.camadas.join(" ") }, camadas.rotulos);
    t.textContent = p.curto || p.nome.split(" — ")[0];
  });

  /* enfeites */
  const oc = el("text", { x:1150, y:430, class:"rot-oceano",
    transform:"rotate(90 1150 430)" }, camadas.rotulos);
  oc.textContent = "OCEANO ATLÂNTICO";
  const ol = el("text", { x:1178, y:430, class:"selo-dir selo-mar",
    transform:"rotate(90 1178 430)" }, camadas.rotulos);
  ol.textContent = "LESTE";
  bussola();
  setaUmidade();
}

function bussola(){
  const g = el("g", { class:"bussola" }, camadas.enfeites);
  const cx = 96, cy = 120, r = 38;
  el("circle", { cx, cy, r, class:"bussola-fundo" }, g);
  el("path", { d:`M ${cx} ${cy-r+5} L ${cx+9} ${cy} L ${cx} ${cy+r-5} L ${cx-9} ${cy} Z`,
               class:"bussola-agulha" }, g);
  [["N",cx,cy-r-5],["S",cx,cy+r+15],["L",cx+r+11,cy+5],["O",cx-r-11,cy+5]]
    .forEach(([txt,x,y]) => { el("text", { x, y, class:"bussola-txt" }, g).textContent = txt; });
}

/* seta explicando o gradiente de umidade */
function setaUmidade(){
  const g = el("g", { class:"faixa-umidade" }, camadas.enfeites);
  el("path", { d:"M 1040 754 L 250 754", class:"seta-umid" }, g);
  el("path", { d:"M 262 747 L 244 754 L 262 761 Z", class:"seta-ponta" }, g);
  const a = el("text", { x:1040, y:742, class:"txt-umid fim" }, g);
  a.textContent = "mais úmido · mar";
  const b = el("text", { x:250, y:742, class:"txt-umid inicio" }, g);
  b.textContent = "mais seco · sertão";
}

/* ---------- tooltip ---------- */
function seloDe(d){
  if (d.lado) return { txt:"Limite " + d.lado, cor:d.cor || "#888" };
  if (d.tipo === "terra") return { txt:"Divisa em terra", cor:d.cor };
  if (d.tipo === "rio" || d.tipo === "laguna") return { txt:"Água", cor:"#1273AF" };
  if (d.camadas){
    const z = ZONAS.find(z => z.id === d.zona);
    return { txt:z ? z.nome : CAMADAS[d.camadas[0]].nome, cor:z ? z.cor : CAMADAS[d.camadas[0]].cor };
  }
  return { txt:"", cor:"#888" };
}
function mostrarTip(e, d){
  const s = seloDe(d);
  tip.innerHTML =
    `<span class="tip-selo" style="background:${s.cor}">${s.txt}</span>` +
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
  if (x + c.width  > window.innerWidth  - 8) x = e.clientX - c.width  - m;
  if (y + c.height > window.innerHeight - 8) y = e.clientY - c.height - m;
  tip.style.left = x + "px"; tip.style.top = y + "px";
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
const modal   = document.getElementById("modal");
const mCaixa  = document.getElementById("modal-caixa");
const mTitulo = document.getElementById("modal-titulo");
const mSelo   = document.getElementById("modal-selo");
const mResumo = document.getElementById("modal-resumo");
const mCorpo  = document.getElementById("modal-corpo");
const mLinks  = document.getElementById("modal-links");

function abrirModal(d){
  esconderTip();
  const s = seloDe(d);
  mTitulo.textContent = d.nome;
  mSelo.textContent = s.txt;
  mSelo.style.background = s.cor;
  mResumo.textContent = d.resumo || "";
  mCorpo.innerHTML = "";
  const extra = [];
  if (d.camadas){
    extra.push(["Cai em", d.camadas.map(k => CAMADAS[k].nome).join(" · ")]);
  }
  if (d.vizinho){
    const v = VIZINHOS.find(x => x.id === d.vizinho);
    if (v) extra.push(["Vizinho deste trecho", `<b>${v.nome}</b> — a <b>${v.lado}</b> de Alagoas.`]);
  }
  [...extra, ...(d.itens || [])].forEach(([h, p]) => {
    const b = document.createElement("div");
    b.className = "linha";
    b.innerHTML = `<h4>${h}</h4><p>${p}</p>`;
    mCorpo.appendChild(b);
  });
  mLinks.innerHTML = "";
  relacionados(d).forEach(o => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip-rel";
    const z = ZONAS.find(z => z.id === (o.zona || o.id));
    b.style.setProperty("--cor", o.cor || (z ? z.cor : "#888"));
    b.textContent = o.nome.split(" — ")[0];
    b.addEventListener("click", () => abrirModal(o));
    mLinks.appendChild(b);
  });
  document.querySelector(".modal-links-tit").hidden = !mLinks.children.length;
  mLinks.hidden = !mLinks.children.length;
  modal.classList.add("ver");
  document.body.classList.add("travado");
  mCaixa.scrollTop = 0;
  mCaixa.focus();
}
function fecharModal(){
  modal.classList.remove("ver");
  document.body.classList.remove("travado");
}
modal.addEventListener("click", e => { if (e.target === modal) fecharModal(); });
document.getElementById("modal-fechar").addEventListener("click", fecharModal);
document.addEventListener("keydown", e => { if (e.key === "Escape") fecharModal(); });

function relacionados(d){
  if (d.zona) {
    const z = ZONAS.find(z => z.id === d.zona);
    const irmaos = PONTOS.filter(p => p.zona === d.zona && p.id !== d.id).slice(0, 4);
    return z ? [z, ...irmaos] : irmaos;
  }
  if (ZONAS.some(z => z.id === d.id)) return PONTOS.filter(p => p.zona === d.id).slice(0, 5);
  return [];
}

/* ---------- legendas e foco ---------- */
let foco = null;

function montarLegendas(){
  const cxV = document.getElementById("leg-vizinhos");
  VIZINHOS.forEach(v => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.dataset.alvo = v.id;
    b.style.setProperty("--cor", v.cor);
    b.innerHTML = `<i></i><b>${v.dir}</b> ${v.nome}`;
    b.addEventListener("click", () => alternarFoco("viz", v.id, b));
    cxV.appendChild(b);
  });

  const cxZ = document.getElementById("leg-zonas");
  ZONAS.forEach(z => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.dataset.alvo = z.id;
    b.style.setProperty("--cor", z.cor);
    b.innerHTML = `<i></i>${z.nome}`;
    b.addEventListener("click", () => alternarFoco("zona", z.id, b));
    cxZ.appendChild(b);
  });

  const cxC = document.getElementById("leg-camadas");
  Object.entries(CAMADAS).forEach(([id, c]) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip chip-camada"; b.dataset.alvo = id;
    b.style.setProperty("--cor", c.cor);
    b.innerHTML = `<i></i>${c.nome}`;
    b.addEventListener("click", () => alternarFoco("camada", id, b));
    cxC.appendChild(b);
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

  if (tipo === "viz"){
    ZONAS.forEach(z => { apagar(document.getElementById("f-" + z.id));
                         apagar(document.getElementById("r-" + z.id)); });
    document.querySelectorAll(".ponto, .rot-ponto").forEach(apagar);
    VIZINHOS.filter(v => v.tipo !== "mar").forEach(v => {
      if (v.id === id) focar(document.getElementById("f-" + v.id));
      else { apagar(document.getElementById("f-" + v.id));
             apagar(document.getElementById("r-" + v.id)); }
    });
    const d = DIVISAS.find(x => x.vizinho === id);
    DIVISAS.forEach(x => (x.vizinho === id ? focar : apagar)(document.getElementById("f-" + x.id)));
    if (id === "sergipe") focar(document.getElementById("f-sao-francisco"));
    if (id === "oceano"){
      document.querySelectorAll(".camada-vizinhos .vizinho, .rot-mun").forEach(apagar);
      document.querySelector(".rot-oceano").classList.add("foco");
    }
    if (!d && id !== "oceano") { /* sem divisa seca */ }
  } else if (tipo === "zona"){
    ZONAS.forEach(z => {
      if (z.id === id) { focar(document.getElementById("f-" + z.id)); return; }
      apagar(document.getElementById("f-" + z.id));
      apagar(document.getElementById("r-" + z.id));
    });
    document.querySelectorAll(".camada-vizinhos .vizinho, .rot-mun").forEach(apagar);
    PONTOS.forEach(p => {
      if (p.zona === id) return;
      apagar(document.getElementById("f-" + p.id));
      apagar(document.getElementById("rp-" + p.id));
    });
  } else {
    document.querySelectorAll(".camada-vizinhos .vizinho, .rot-mun").forEach(apagar);
    PONTOS.forEach(p => {
      if (p.camadas.includes(id)) { focar(document.getElementById("f-" + p.id)); return; }
      apagar(document.getElementById("f-" + p.id));
      apagar(document.getElementById("rp-" + p.id));
    });
  }
}

/* ---------- busca ---------- */
function montarBusca(){
  const campo = document.getElementById("busca");
  const lista = document.getElementById("busca-lista");
  const tudo = [...PONTOS, ...ZONAS, ...VIZINHOS, ...AGUAS, ...DIVISAS];
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
        campo.value = ""; lista.classList.remove("ver");
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
const aplicarView = () => svg.setAttribute("viewBox", `${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`);
function limitar(){
  VIEW.x = Math.min(Math.max(VIEW.x, -50), VIEW0.w - VIEW.w + 50);
  VIEW.y = Math.min(Math.max(VIEW.y, -50), VIEW0.h - VIEW.h + 50);
}
function zoom(f, cx, cy){
  const nw = Math.min(VIEW0.w, Math.max(VIEW0.w * 0.25, VIEW.w * f));
  const k = nw / VIEW.w;
  VIEW.x = cx - (cx - VIEW.x) * k;
  VIEW.y = cy - (cy - VIEW.y) * k;
  VIEW.w = nw; VIEW.h = VIEW0.h * (nw / VIEW0.w);
  limitar(); aplicarView();
}
function paraSVG(e){
  const r = svg.getBoundingClientRect();
  return [VIEW.x + ((e.clientX - r.left) / r.width) * VIEW.w,
          VIEW.y + ((e.clientY - r.top) / r.height) * VIEW.h];
}
function ligarNavegacao(){
  document.getElementById("zoom-mais").onclick  = () => zoom(0.75, VIEW.x + VIEW.w/2, VIEW.y + VIEW.h/2);
  document.getElementById("zoom-menos").onclick = () => zoom(1.33, VIEW.x + VIEW.w/2, VIEW.y + VIEW.h/2);
  document.getElementById("zoom-reset").onclick = () => { Object.assign(VIEW, VIEW0); aplicarView(); };
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
    const atual = [viewIni.x + ((e.clientX - r.left) / r.width) * VIEW.w,
                   viewIni.y + ((e.clientY - r.top) / r.height) * VIEW.h];
    const dx = ini[0] - atual[0], dy = ini[1] - atual[1];
    moveu = Math.max(moveu, Math.abs(dx) + Math.abs(dy));
    if (moveu <= 6) return;
    svg.classList.add("arrastando"); esconderTip();
    VIEW.x = viewIni.x + dx; VIEW.y = viewIni.y + dy;
    limitar(); aplicarView();
  });
  document.addEventListener("pointerup", () => {
    arrastando = false;
    svg.classList.remove("arrastando");
    setTimeout(() => { moveu = 0; }, 0);
  });
}

/* ---------- tabelas ---------- */
function montarTabelas(){
  const t = document.getElementById("tab-limites");
  LIMITES.forEach(([lado, quem, sep]) => {
    const v = VIZINHOS.find(x => x.nome === quem);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><b>${lado}</b></td>` +
                   `<td><b style="color:${v ? v.cor : "inherit"}">${quem}</b></td><td>${sep}</td>`;
    if (v){ tr.style.cursor = "pointer"; tr.onclick = () => abrirModal(REGISTRO[v.id] || v); }
    t.appendChild(tr);
  });

  const id = document.getElementById("identidade");
  IDENTIDADE.forEach(([k, v]) => {
    const d = document.createElement("div");
    d.className = "id-item";
    d.innerHTML = `<span>${k}</span><b>${v}</b>`;
    id.appendChild(d);
  });
}

/* ---------- início ---------- */
desenhar();
aplicarView();
montarLegendas();
montarBusca();
ligarNavegacao();
montarTabelas();
