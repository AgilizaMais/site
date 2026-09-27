#!/usr/bin/env python3
"""Gera versões de ARQUIVO ÚNICO das páginas de estudo.

Embute o CSS e o JS dentro de cada HTML, para que cada página funcione
sozinha — sem depender de estilo.css, dados.js ou mapa.js estarem no
mesmo lugar. Serve para hospedagens onde só os .html sobem, ou onde os
.js não são entregues.

    python3 gerar-arquivo-unico.py

Saída: <pasta>/_arquivo-unico/*.html
"""
import base64
import json
import os

SITES = {
    "alagoas": ["index.html", "historia.html", "estado.html", "simulado.html"],
    "aracaju": ["index.html", "resumo.html"],
}


def data_uri(caminho, mime):
    with open(caminho, "rb") as f:
        return "data:%s;base64,%s" % (mime, base64.b64encode(f.read()).decode())


def bloco_icones(base, pagina):
    """Reescreve o bloco de ícones com tudo embutido.

    O favicon vira data URI em todas as páginas. O manifest também, mas só na
    index — é dela que sai o atalho, e embutir os PNGs nele pesa. Dentro de um
    manifest data URI, caminho relativo não resolve, então os ícones dele
    precisam ser data URI igualmente; start_url e scope são omitidos de
    propósito, e aí o navegador usa a própria página.

    O apple-touch-icon continua apontando para o arquivo: o iOS não aceita
    data URI nesse campo.
    """
    tema  = ler(os.path.join(base, "site.webmanifest"))
    manif = json.loads(tema)
    linhas = [
        '<link rel="icon" href="%s" sizes="64x64">' % data_uri(os.path.join(base, "icone-64.png"), "image/png"),
        '<link rel="apple-touch-icon" href="icone-180.png">',
    ]
    if pagina == "index.html":
        for icone in manif["icons"]:
            icone["src"] = data_uri(os.path.join(base, icone["src"]), "image/png")
        manif.pop("start_url", None)
        manif.pop("scope", None)
        embutido = base64.b64encode(json.dumps(manif).encode()).decode()
        linhas.append('<link rel="manifest" href="data:application/manifest+json;base64,%s">' % embutido)
    return "\n".join(linhas)

def ler(caminho):
    with open(caminho, encoding="utf-8") as f:
        return f.read()

for pasta, paginas in SITES.items():
    base = os.path.join(os.path.dirname(os.path.abspath(__file__)), pasta)
    if not os.path.isdir(base):
        continue
    css   = ler(os.path.join(base, "estilo.css")) if os.path.exists(os.path.join(base, "estilo.css")) else ""
    dados = ler(os.path.join(base, "dados.js"))
    mapa  = ler(os.path.join(base, "mapa.js"))

    # embutir só é seguro se o conteúdo não fechar a própria tag
    assert "</style>"  not in css
    assert "</script>" not in dados and "</script>" not in mapa

    saida = os.path.join(base, "_arquivo-unico")
    os.makedirs(saida, exist_ok=True)

    for pagina in paginas:
        html = ler(os.path.join(base, pagina))
        inicio = html.index("<!-- icones -->")
        fim    = html.index("<!-- /icones -->") + len("<!-- /icones -->")
        antigo = html[inicio:fim]
        # preserva as metas (theme-color, títulos do atalho) e troca só os links
        metas = [l for l in antigo.splitlines() if l.startswith("<meta")]
        html = html[:inicio] + bloco_icones(base, pagina) + "\n" + "\n".join(metas) + html[fim:]

        html = html.replace('<link rel="stylesheet" href="estilo.css">',
                            "<style>\n" + css + "\n</style>")
        html = html.replace('<script src="dados.js"></script>\n<script src="mapa.js"></script>',
                            "<script>\n" + dados + "\n" + mapa + "\n</script>")
        assert 'href="estilo.css"' not in html, pagina
        assert 'src="dados.js"'    not in html, pagina
        assert 'src="mapa.js"'     not in html, pagina
        assert 'href="icone-64.png"'      not in html, pagina
        assert 'href="site.webmanifest"'  not in html, pagina
        destino = os.path.join(saida, pagina)
        with open(destino, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"{pasta}/{pagina}: {len(html)//1024} KB")
