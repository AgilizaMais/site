/**
 * Prepara a imagem-fonte do Hero.
 *
 * A imagem não é usada como textura: em runtime ela é amostrada para gerar as
 * POSIÇÕES das partículas. Este script apenas a reduz e limpa o fundo, para que
 * a amostragem não gaste pontos em ruído de compressão.
 *
 *   node scripts/prepare-hero-source.mjs <entrada.jpg>
 */
import fs from 'node:fs';
import jpeg from 'jpeg-js';

const input = process.argv[2];
const output = 'components/scenes/01-hero/assets/brain-source.jpg';
const TARGET_W = 900;
/** Abaixo disto é fundo: zera, para não virar poeira na amostragem. */
const FLOOR = 26;

const raw = jpeg.decode(fs.readFileSync(input), { useTArray: true });
const scale = TARGET_W / raw.width;
const w = TARGET_W;
const h = Math.round(raw.height * scale);
const out = new Uint8Array(w * h * 4);

for (let y = 0; y < h; y += 1) {
  for (let x = 0; x < w; x += 1) {
    // Média de área: reduzir com amostragem pontual perderia as linhas finas.
    const sx0 = Math.floor(x / scale);
    const sx1 = Math.max(sx0 + 1, Math.floor((x + 1) / scale));
    const sy0 = Math.floor(y / scale);
    const sy1 = Math.max(sy0 + 1, Math.floor((y + 1) / scale));
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let sy = sy0; sy < sy1 && sy < raw.height; sy += 1) {
      for (let sx = sx0; sx < sx1 && sx < raw.width; sx += 1) {
        const i = (sy * raw.width + sx) * 4;
        r += raw.data[i];
        g += raw.data[i + 1];
        b += raw.data[i + 2];
        n += 1;
      }
    }
    r /= n;
    g /= n;
    b /= n;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const o = (y * w + x) * 4;
    if (lum < FLOOR) {
      out[o] = 0;
      out[o + 1] = 0;
      out[o + 2] = 0;
    } else {
      out[o] = Math.round(r);
      out[o + 1] = Math.round(g);
      out[o + 2] = Math.round(b);
    }
    out[o + 3] = 255;
  }
}

const encoded = jpeg.encode({ data: out, width: w, height: h }, 78);
fs.writeFileSync(output, encoded.data);
console.log(`${output}: ${w}x${h}, ${(encoded.data.length / 1024).toFixed(0)} KB`);
