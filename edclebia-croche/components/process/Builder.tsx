'use client';

import { useMemo, useState } from 'react';
import { brand, builder, waLink } from '@/lib/content';
import { WhatsAppIcon } from '@/components/Icons';
import s from './Builder.module.css';
import { asset } from '@/lib/asset';

type ColorId = (typeof builder.colors)[number]['id'];

export function Builder() {
  const [piece, setPiece] = useState<string>(builder.pieces[0]);
  const [occasion, setOccasion] = useState<string>(builder.occasions[0]);
  const [size, setSize] = useState<string>('M');
  const [color, setColor] = useState<ColorId>('off-white');
  const [notes, setNotes] = useState('');
  const [name, setName] = useState('');

  const colorLabel = builder.colors.find((c) => c.id === color)?.label ?? '';
  const message = useMemo(() => {
    const lines = [
      `Olá, ${brand.artisan}! 💗 Vim pelo site e quero encomendar uma peça:`,
      '',
      `• Peça: ${piece}`,
      `• Ocasião: ${occasion}`,
      `• Cor do fio: ${colorLabel}`,
      `• Tamanho: ${size}`,
    ];
    if (notes.trim()) lines.push(`• Detalhes: ${notes.trim()}`);
    lines.push('');
    lines.push(name.trim() ? `Meu nome é ${name.trim()}. Aguardo seu retorno!` : 'Aguardo seu retorno!');
    return lines.join('\n');
  }, [piece, occasion, colorLabel, size, notes, name]);

  return (
    <div className={`container ${s.wrap}`} id="encomenda">
      <div className={s.panel} data-reveal>
        <div className={s.form}>
          <p className="eyebrow">{builder.eyebrow}</p>
          <h3 className={`display ${s.title}`}>
            {builder.title} <em className="accent">{builder.accent}</em>
          </h3>
          <p className={s.intro}>{builder.intro}</p>

          <fieldset className={s.group}>
            <legend>Qual peça?</legend>
            <div className={s.chips}>
              {builder.pieces.map((p) => (
                <button key={p} type="button" className={`${s.chip} ${piece === p ? s.on : ''}`} aria-pressed={piece === p} onClick={() => setPiece(p)}>
                  {p}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={s.group}>
            <legend>Para qual ocasião?</legend>
            <div className={s.chips}>
              {builder.occasions.map((o) => (
                <button key={o} type="button" className={`${s.chip} ${occasion === o ? s.on : ''}`} aria-pressed={occasion === o} onClick={() => setOccasion(o)}>
                  {o}
                </button>
              ))}
            </div>
          </fieldset>

          <div className={s.row}>
            <fieldset className={s.group}>
              <legend>
                Cor do fio <span className={s.legendValue}>· {colorLabel}</span>
              </legend>
              <div className={s.swatches}>
                {builder.colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`${s.swatch} ${color === c.id ? s.swatchOn : ''}`}
                    style={{ ['--c' as string]: c.hex }}
                    aria-pressed={color === c.id}
                    aria-label={c.label}
                    title={c.label}
                    onClick={() => setColor(c.id)}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className={s.group}>
              <legend>Tamanho</legend>
              <div className={s.chips}>
                {builder.sizes.map((z) => (
                  <button key={z} type="button" className={`${s.chip} ${s.chipSm} ${size === z ? s.on : ''}`} aria-pressed={size === z} onClick={() => setSize(z)}>
                    {z}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className={s.row}>
            <label className={s.field}>
              <span>Detalhes (opcional)</span>
              <input
                type="text"
                value={notes}
                maxLength={160}
                placeholder="Ex.: com franjas, decote em V, para dezembro…"
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <label className={s.field}>
              <span>Seu nome</span>
              <input type="text" value={name} maxLength={60} autoComplete="given-name" placeholder="Como podemos te chamar?" onChange={(e) => setName(e.target.value)} />
            </label>
          </div>
        </div>

        <div className={s.preview}>
          <div className={s.phone}>
            <div className={s.chatHead}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset('/img/logo.webp')} alt="" width={600} height={386} />
              <div>
                <strong>{brand.name}</strong>
                <span>{brand.whatsapp.display}</span>
              </div>
            </div>
            <div className={s.chat} aria-live="polite">
              <span className={s.previewLabel}>{builder.preview}</span>
              <p className={s.bubble}>
                {message}
                <span className={s.time}>agora ✓✓</span>
              </p>
            </div>
            <a href={waLink(message)} target="_blank" rel="noopener noreferrer" className={`btn btn-wa ${s.send}`}>
              <WhatsAppIcon size={20} />
              {builder.send}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
