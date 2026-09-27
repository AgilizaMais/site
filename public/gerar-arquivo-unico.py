#!/usr/bin/env python3
"""Gera versões de ARQUIVO ÚNICO das páginas de estudo.

Embute o CSS e o JS dentro de cada HTML, para que cada página funcione
sozinha — sem depender de estilo.css, dados.js ou mapa.js estarem no
mesmo lugar. Serve para hospedagens onde só os .html sobem, ou onde os
.js não são entregues.

    python3 gerar-arquivo-unico.py

Saída: <pasta>/_arquivo-unico/*.html
"""
import os

SITES = {
    "alagoas": ["index.html", "historia.html", "estado.html", "simulado.html"],
    "aracaju": ["index.html", "resumo.html"],
}

def ler(caminho):
    with open(caminho, encoding="utf-8") as f:
        return f.read()

for pasta, paginas in SITES.items():
    base = os.path.join(os.path.dirname(os.path.abspath(__file__)), pasta)
    if not os.path.isdir(base):
        continue
    css   = ler(os.path.join(base, "estilo.css"))
    dados = ler(os.path.join(base, "dados.js"))
    mapa  = ler(os.path.join(base, "mapa.js"))

    # embutir só é seguro se o conteúdo não fechar a própria tag
    assert "</style>"  not in css
    assert "</script>" not in dados and "</script>" not in mapa

    saida = os.path.join(base, "_arquivo-unico")
    os.makedirs(saida, exist_ok=True)

    for pagina in paginas:
        html = ler(os.path.join(base, pagina))
        html = html.replace('<link rel="stylesheet" href="estilo.css">',
                            "<style>\n" + css + "\n</style>")
        html = html.replace('<script src="dados.js"></script>\n<script src="mapa.js"></script>',
                            "<script>\n" + dados + "\n" + mapa + "\n</script>")
        assert 'href="estilo.css"' not in html, pagina
        assert 'src="dados.js"'    not in html, pagina
        assert 'src="mapa.js"'     not in html, pagina
        destino = os.path.join(saida, pagina)
        with open(destino, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"{pasta}/{pagina}: {len(html)//1024} KB")
