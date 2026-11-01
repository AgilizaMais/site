"""Redesenho vetorial do logo Edclebia Crochê (mesmo desenho, traço corrigido)."""
import math
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

PINK = '#E9467E'
PINK_D = '#C9306A'
LILAC = '#6E55BF'
LILAC_D = '#5641A3'
HOOK = '#7B3A4C'
HOOK_L = '#A3586B'

W, H = 1200, 860


def heart_path(cx, cy, s, rot=0.0):
    """Coração suave (y para baixo), centro (cx,cy), meia-largura s."""
    pts = [
        ('M', [(0, -0.30)]),
        ('C', [(0.04, -0.86), (0.70, -1.02), (0.98, -0.58)]),
        ('C', [(1.24, -0.14), (0.86, 0.36), (0.0, 0.98)]),
        ('C', [(-0.86, 0.36), (-1.24, -0.14), (-0.98, -0.58)]),
        ('C', [(-0.70, -1.02), (-0.04, -0.86), (0, -0.30)]),
    ]
    c, sn = math.cos(rot), math.sin(rot)
    out = []
    for cmd, ps in pts:
        tp = []
        for x, y in ps:
            X = cx + (x * c - y * sn) * s
            Y = cy + (x * sn + y * c) * s
            tp.append(f'{X:.1f} {Y:.1f}')
        out.append(cmd + ' ' + ', '.join(tp))
    return ' '.join(out) + ' Z'


def rot_pt(cx, cy, x, y, rot, s):
    c, sn = math.cos(rot), math.sin(rot)
    return cx + (x * c - y * sn) * s, cy + (x * sn + y * c) * s


def rings(ox, oy, r0, r1, step):
    out = []
    r = r0
    while r <= r1:
        out.append(f'M {ox - r:.1f} {oy:.1f} a {r:.1f} {r:.1f} 0 1 0 {2 * r:.1f} 0 a {r:.1f} {r:.1f} 0 1 0 {-2 * r:.1f} 0')
        r += step
    return out


def wraps_groups(h, mirror=1):
    """Duas camadas de voltas: uma cobre o novelo todo, outra cruza um dos lobos."""
    cx, cy, s, rot = h['cx'], h['cy'], h['s'], h['rot']
    a = rot_pt(cx, cy, 1.55 * mirror, 1.25, rot, s)
    b = rot_pt(cx, cy, -1.35 * mirror, -1.45, rot, s)
    lobe = rot_pt(cx, cy, -0.66 * mirror, -0.52, rot, s)
    g1 = rings(a[0], a[1], 1.15 * s, 3.4 * s, 0.205 * s)
    g2 = rings(b[0], b[1], 1.05 * s, 2.6 * s, 0.19 * s)
    return g1, g2, lobe


def text_path(font_file, text, x, y, size, tracking=0):
    font = TTFont(font_file)
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font['head'].unitsPerEm
    hmtx = font['hmtx']
    scale = size / upm
    pen = SVGPathPen(gs)
    cursor = 0
    widths = []
    for ch in text:
        g = cmap.get(ord(ch))
        if g is None:
            continue
        tp = TransformPen(pen, (scale, 0, 0, -scale, x + cursor * scale, y))
        gs[g].draw(tp)
        cursor += hmtx[g][0] + tracking
        widths.append(hmtx[g][0])
    return pen.getCommands(), cursor * scale


def build(font_file, out):
    pink = dict(cx=520, cy=330, s=225, rot=-0.30)
    lilac = dict(cx=735, cy=318, s=150, rot=0.32)
    ph = heart_path(**pink)
    lh = heart_path(**lilac)

    word1, w1 = text_path(font_file, 'Edclebia', 0, 0, 150)
    word2, w2 = text_path(font_file, 'Crochê', 0, 0, 150)
    gap = 38
    total = w1 + gap + w2
    tx = (W - total) / 2
    ty = 765

    def wraps_svg(h, clip, mirror, fill):
        g1, g2, lobe = wraps_groups(h, mirror)
        rid = clip + 'r'
        lr = 0.8 * h['s']
        a = '\n'.join(f'<path d="{d}"/>' for d in g1)
        b = '\n'.join(f'<path d="{d}"/>' for d in g2)
        return f'''<clipPath id="{rid}"><circle cx="{lobe[0]:.1f}" cy="{lobe[1]:.1f}" r="{lr:.1f}"/></clipPath>
    <g clip-path="url(#{clip})">
      <g>{a}</g>
      <g clip-path="url(#{rid})">
        <circle cx="{lobe[0]:.1f}" cy="{lobe[1]:.1f}" r="{lr:.1f}" fill="{fill}" stroke="none"/>
        {b}
      </g>
    </g>'''

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <title>Edclebia Crochê</title>
  <defs>
    <clipPath id="cp"><path d="{ph}"/></clipPath>
    <clipPath id="cl"><path d="{lh}"/></clipPath>
    <linearGradient id="gp" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F2639A"/><stop offset="1" stop-color="{PINK_D}"/>
    </linearGradient>
    <linearGradient id="gl" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8268D3"/><stop offset="1" stop-color="{LILAC_D}"/>
    </linearGradient>
    <linearGradient id="gh" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="{HOOK}"/><stop offset="1" stop-color="{HOOK_L}"/>
    </linearGradient>
  </defs>

  <!-- fio lilás: sai do coração menor e faz a volta à direita -->
  <path d="M 812 412 C 860 470, 900 520, 880 575 C 862 622, 905 650, 1000 640 C 1060 634, 1110 615, 1140 600"
        fill="none" stroke="{LILAC}" stroke-width="7" stroke-linecap="round"/>

  <!-- coração lilás (atrás) -->
  <path d="{lh}" fill="url(#gl)"/>
  <g fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round">
{wraps_svg(lilac, 'cl', -1, 'url(#gl)')}
  </g>

  <!-- fio rosa: sai do coração maior e faz a volta à esquerda -->
  <path d="M 318 470 C 250 500, 120 470, 90 405 C 62 345, 120 300, 175 330 C 230 360, 205 450, 140 520 C 100 562, 70 580, 60 600"
        fill="none" stroke="{PINK}" stroke-width="7" stroke-linecap="round"/>

  <!-- coração rosa (na frente), com respiro branco separando do lilás -->
  <path d="{ph}" fill="none" stroke="#fff" stroke-width="16" stroke-linejoin="round"/>
  <path d="{ph}" fill="url(#gp)"/>
  <g fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round">
{wraps_svg(pink, 'cp', 1, 'url(#gp)')}
  </g>

  <!-- agulha de crochê atravessando o novelo -->
  <g stroke-linecap="round" fill="none">
    <path d="M 325 528 L 790 150" stroke="#fff" stroke-width="32"/>
    <path d="M 325 528 L 790 150" stroke="url(#gh)" stroke-width="20"/>
    <path d="M 325 528 L 470 410" stroke="{HOOK}" stroke-width="24"/>
    <path d="M 790 150 C 806 137, 822 140, 824 154 C 826 166, 812 172, 803 164" stroke="#fff" stroke-width="28"/>
    <path d="M 790 150 C 806 137, 822 140, 824 154 C 826 166, 812 172, 803 164" stroke="{HOOK_L}" stroke-width="16"/>
  </g>

  <!-- nome -->
  <g transform="translate({tx:.1f} {ty})">
    <path d="{word1}" fill="{PINK}" stroke="{PINK}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="{word2}" fill="{LILAC}" stroke="{LILAC}" stroke-width="2.2" stroke-linejoin="round" transform="translate({w1 + gap:.1f} 0)"/>
  </g>
</svg>
'''
    open(out, 'w').write(svg)
    print('ok', out, round(total))


if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2])
