'use client';

import { useEffect, useState } from 'react';
import { introBus } from '@/lib/motion/bus';
import s from './Preloader.module.css';
import { asset } from '@/lib/asset';

/**
 * Abertura curta (≤ 1,6 s): o logo aparece enquanto um fio "torcido" corre por baixo.
 * Espera fontes + foto do hero (com teto de tempo) e libera a intro do hero.
 */
export function Preloader() {
  const [phase, setPhase] = useState<'in' | 'out' | 'gone'>('in');

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || new URLSearchParams(window.location.search).has('nointro')) {
      setPhase('gone');
      introBus.done();
      return;
    }
    const start = performance.now();
    const img = document.querySelector<HTMLImageElement>('[data-hero-photo]');
    const imgReady = img && !img.complete
      ? new Promise<void>((r) => {
          img.addEventListener('load', () => r(), { once: true });
          img.addEventListener('error', () => r(), { once: true });
        })
      : Promise.resolve();
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts?.ready ?? Promise.resolve();
    const cap = new Promise<void>((r) => setTimeout(r, 1800));
    let t1 = 0;
    let t2 = 0;
    Promise.race([Promise.all([imgReady, fonts]), cap]).then(() => {
      const wait = Math.max(0, 750 - (performance.now() - start));
      t1 = window.setTimeout(() => {
        setPhase('out');
        introBus.done();
        t2 = window.setTimeout(() => setPhase('gone'), 900);
      }, wait);
    });
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === 'gone') return null;
  return (
    <div className={`${s.pre} ${phase === 'out' ? s.out : ''}`} aria-hidden>
      <div className={s.center}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset('/img/logo.webp')} alt="" width={600} height={401} className={s.logo} />
        <span className={s.thread} />
      </div>
    </div>
  );
}
