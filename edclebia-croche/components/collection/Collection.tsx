'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { categories, collection, productMessage, products, waLink, type Category } from '@/lib/content';
import { gsap, registerGsap, ScrollTrigger } from '@/lib/motion/gsap';
import { SectionTitle } from '@/components/SectionTitle';
import { ArrowRight, WhatsAppIcon } from '@/components/Icons';
import s from './Collection.module.css';

const catLabel = Object.fromEntries(categories.map((c) => [c.id, c.label])) as Record<string, string>;

export function Collection() {
  const section = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [filter, setFilter] = useState<Category | 'todas'>('todas');

  const items = useMemo(
    () => (filter === 'todas' ? products : products.filter((p) => p.category === filter)),
    [filter],
  );

  // vitrine horizontal "pinada" no desktop
  useEffect(() => {
    registerGsap();
    const sec = section.current;
    const tr = track.current;
    const vp = viewport.current;
    if (!sec || !tr || !vp) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1025px) and (prefers-reduced-motion: no-preference)', () => {
      const distance = () => Math.max(0, tr.scrollWidth - vp.clientWidth);
      const tween = gsap.to(tr, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: sec,
          start: 'top top',
          end: () => `+=${distance() + window.innerHeight * 0.25}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (st) => {
            if (bar.current) bar.current.style.transform = `scaleX(${st.progress})`;
          },
        },
      });
      // cards entram em leque conforme passam
      return () => tween.kill();
    });
    mm.add('(max-width: 1024px)', () => {
      const onScroll = () => {
        const max = vp.scrollWidth - vp.clientWidth;
        if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? vp.scrollLeft / max : 1})`;
      };
      vp.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return () => vp.removeEventListener('scroll', onScroll);
    });
    return () => mm.revert();
  }, []);

  // ao filtrar: reanima os cards e recalcula o pin
  useEffect(() => {
    const tr = track.current;
    if (!tr) return;
    viewport.current?.scrollTo({ left: 0 });
    const cards = tr.querySelectorAll('[data-card]');
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 40, rotate: 2 },
        { opacity: 1, y: 0, rotate: 0, duration: 0.9, stagger: 0.05, ease: 'expo.out' },
      );
    }
    ScrollTrigger.refresh();
  }, [filter]);

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${(0.5 - y) * 10}deg`);
    el.style.setProperty('--ry', `${(x - 0.5) * 12}deg`);
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
  };
  const onLeave = (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <section ref={section} id="colecao" className={`on-dark ${s.section}`} aria-labelledby="colecao-title">
      <div className={s.glow} aria-hidden />
      <div className={`container ${s.head}`}>
        <SectionTitle id="colecao-title" eyebrow={collection.eyebrow} title={collection.title} accent={collection.accent} />
        <div className={s.headRight}>
          <p className="lead" data-reveal>
            {collection.intro}
          </p>
          <div className={s.filters} role="group" aria-label="Filtrar coleção" data-reveal>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`${s.chip} ${filter === c.id ? s.chipOn : ''}`}
                aria-pressed={filter === c.id}
                onClick={() => setFilter(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={viewport} className={s.viewport}>
        <ul ref={track} className={s.track}>
          {items.map((p, i) => (
            <li key={p.slug} className={s.item} data-card>
              <article
                className={s.card}
                style={{ ['--tone' as string]: p.tone }}
                onPointerMove={onMove}
                onPointerLeave={onLeave}
              >
                <div className={s.media}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={`${p.name} — ${p.note}`} loading="lazy" decoding="async" width={760} height={1013} />
                  <span className={s.glare} aria-hidden />
                  <span className={s.num} aria-hidden>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className={s.meta}>
                  <span className={s.cat}>{catLabel[p.category]}</span>
                  <h3 className={s.name}>{p.name}</h3>
                  <p className={s.note}>{p.note}</p>
                  <a
                    href={waLink(productMessage(p))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={s.cta}
                    aria-label={`${collection.cardCta}: encomendar ${p.name} pelo WhatsApp`}
                  >
                    <WhatsAppIcon size={17} />
                    {collection.cardCta}
                    <ArrowRight size={16} className={s.ctaArrow} />
                  </a>
                </div>
              </article>
            </li>
          ))}
          <li className={`${s.item} ${s.endItem}`}>
            <div className={s.endCard}>
              <p className="display">
                Não achou a sua? <em className="accent">A gente cria.</em>
              </p>
              <a href="#sob-medida" className="btn btn-outline-light">
                Encomendar sob medida <ArrowRight className="btn-arrow" />
              </a>
            </div>
          </li>
        </ul>
      </div>

      <div className={`container ${s.progress}`} aria-hidden>
        <span className={s.progressTrack}>
          <span ref={bar} className={s.progressBar} />
        </span>
        <span className={s.progressHint}>role para ver mais</span>
      </div>
    </section>
  );
}
