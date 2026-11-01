'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { YarnEngine } from '@/lib/yarn/YarnEngine';
import { YarnCanvas } from '@/components/yarn/YarnCanvas';
import { brand, story } from '@/lib/content';
import { registerGsap, ScrollTrigger } from '@/lib/motion/gsap';
import { InstagramIcon } from '@/components/Icons';
import s from './Story.module.css';

export function Story() {
  const root = useRef<HTMLElement>(null);
  const engine = useRef<YarnEngine | null>(null);
  const progress = useRef(0);

  useEffect(() => {
    registerGsap();
    const el = root.current;
    if (!el) return;
    // os fios soltos se enrolam no coração do logo conforme a seção entra
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      end: 'center 55%',
      scrub: true,
      onUpdate: (self) => {
        progress.current = self.progress;
        engine.current?.setProgress(self.progress);
      },
    });
    return () => st.kill();
  }, []);

  const onEngine = useCallback((e: YarnEngine) => {
    engine.current = e;
    e.setProgress(progress.current);
  }, []);

  return (
    <section ref={root} id="a-marca" className={`on-dark ${s.section}`} aria-labelledby="marca-title">
      <div className={s.glow} aria-hidden />
      <YarnCanvas preset="heart" className={s.canvas} onEngine={onEngine} />
      <p className="sr-only">
        Animação: fios cor-de-rosa e lilás se enrolam até formar os dois corações do logo da Edclebia Crochê.
      </p>

      <div className={`container ${s.grid}`}>
        <div className={s.heartSpace} aria-hidden />
        <div className={s.copy}>
          <p className="eyebrow" data-reveal>
            {story.eyebrow}
          </p>
          <h2 id="marca-title" className="display h2" data-reveal-lines style={{ marginTop: '1.1rem' }}>
            {story.title.map((l, i) => (
              <span className="line-mask" key={l}>
                <span>
                  {l}
                  {i === story.title.length - 1 && (
                    <>
                      {' '}
                      <em className="accent">{story.accent}</em>
                    </>
                  )}
                </span>
              </span>
            ))}
          </h2>
          {story.paragraphs.map((p) => (
            <p key={p} className="lead" data-reveal style={{ marginTop: '1.3rem' }}>
              {p}
            </p>
          ))}
          <div className={s.sign} data-reveal>
            <span className={`script ${s.signature}`}>{story.signature}</span>
            <span className={s.role}>{story.signatureRole}</span>
          </div>
          <a href={brand.instagram.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-light" data-reveal>
            <InstagramIcon /> Acompanhe no Instagram
          </a>
        </div>
      </div>
    </section>
  );
}
