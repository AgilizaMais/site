'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { YarnEngine } from '@/lib/yarn/YarnEngine';
import { YarnCanvas } from '@/components/yarn/YarnCanvas';
import { Palms } from './Palms';
import { ArrowRight, HeartLine, WhatsAppIcon } from '@/components/Icons';
import { brand, collection, defaultWaMessage, hero, products, waLink } from '@/lib/content';
import { gsap, registerGsap, ScrollTrigger } from '@/lib/motion/gsap';
import { introBus } from '@/lib/motion/bus';
import s from './Hero.module.css';
import { asset } from '@/lib/asset';

const PHOTO = {
  src: asset('/img/modelo-hero.webp'),
  fringe: [0.05, 0.86, 0.76, 0.99] as [number, number, number, number],
  fade: 0.16,
};

const previews = ['vestido-franjas-perola', 'vestido-granny-vitral', 'vestido-esmeralda']
  .map((slug) => products.find((p) => p.slug === slug))
  .filter((p): p is (typeof products)[number] => Boolean(p));

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const engineRef = useRef<YarnEngine | null>(null);
  const introDone = useRef(false);
  const photoReady = useRef(false);

  const handoff = useCallback(() => {
    // a foto 3D (com franjas vivas) assume quando a intro do DOM terminou
    if (!introDone.current || !photoReady.current || !engineRef.current) return;
    engineRef.current.syncPhoto();
    engineRef.current.showPhoto();
  }, []);

  useEffect(() => {
    registerGsap();
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const lines = el.querySelectorAll('[data-hero-line]');
      const fades = el.querySelectorAll('[data-hero-fade]');
      const photo = el.querySelector('[data-hero-photo]');
      const band = el.querySelectorAll('[data-hero-band]');

      if (reduced) {
        gsap.set([lines, fades, photo, band], { clearProps: 'all', opacity: 1 });
        introDone.current = true;
        handoff();
        return;
      }

      gsap.set(lines, { yPercent: 115 });
      gsap.set(fades, { opacity: 0, y: 24 });
      gsap.set(photo, { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.08, transformOrigin: '50% 100%' });
      gsap.set(band, { opacity: 0, y: 40 });

      const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
      tl.to(photo, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.3, ease: 'expo.inOut' }, 0)
        .to(lines, { yPercent: 0, duration: 1.2, stagger: 0.08 }, 0.2)
        .to(fades, { opacity: 1, y: 0, duration: 1, stagger: 0.06 }, 0.5)
        .to(band, { opacity: 1, y: 0, duration: 1, stagger: 0.07 }, 0.6)
        .add(() => {
          introDone.current = true;
          handoff();
        }, 1.35);

      const off = introBus.on(() => {
        tl.play(0);
        engineRef.current?.playIntro();
      });

      // paralaxe de saída: conteúdo sobe mais devagar, a câmera dos fios desliza
      ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (st) => {
          engineRef.current?.setCameraOffset(st.progress * 0.12);
          engineRef.current?.syncPhoto();
        },
      });
      gsap.to('[data-hero-parallax]', {
        yPercent: -18,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      });

      return () => off();
    }, el);

    return () => ctx.revert();
  }, [handoff]);

  const onEngine = useCallback(
    (e: YarnEngine) => {
      engineRef.current = e;
      if (!introBus.isDone()) e.playIntro();
      handoff();
    },
    [handoff],
  );

  const onPhotoReady = useCallback(() => {
    photoReady.current = true;
    handoff();
  }, [handoff]);

  return (
    <section ref={root} id="inicio" className={s.hero} aria-labelledby="hero-title">
      <div className={s.bg} aria-hidden>
        <div className={s.sun} />
        <Palms className={s.palms} />
        <div className={s.haze} />
        <span className={s.dot} style={{ left: '24%', top: '27%' }} />
        <span className={s.dot} style={{ left: '38%', top: '57%', animationDelay: '-2s' }} />
        <span className={s.dot} style={{ left: '61%', top: '18%', animationDelay: '-4s' }} />
        <span className={s.dot} style={{ left: '12%', top: '48%', animationDelay: '-1s' }} />
      </div>

      <div className={s.band} aria-hidden data-hero-band>
        <svg className={s.wave} viewBox="0 0 1440 220" preserveAspectRatio="none">
          <defs>
            <linearGradient id="band-g" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#3a1433" />
              <stop offset="0.55" stopColor="#2a0f25" />
              <stop offset="1" stopColor="#3d1436" />
            </linearGradient>
            <linearGradient id="band-edge" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#f59bb8" stopOpacity="0" />
              <stop offset="0.3" stopColor="#f59bb8" stopOpacity="0.55" />
              <stop offset="0.7" stopColor="#a993e6" stopOpacity="0.5" />
              <stop offset="1" stopColor="#a993e6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 70 C 260 10, 520 0, 760 46 S 1180 120, 1440 40 L1440 220 L0 220 Z" fill="url(#band-g)" />
          <path d="M0 70 C 260 10, 520 0, 760 46 S 1180 120, 1440 40" fill="none" stroke="url(#band-edge)" strokeWidth="1.5" />
        </svg>
        <div className={s.bandFill} />
      </div>

      <div className={s.photoWrap} data-hero-parallax>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          data-hero-photo
          src={PHOTO.src}
          srcSet={`${asset('/img/modelo-hero-sm.webp')} 568w, ${PHOTO.src} 853w`}
          sizes="(max-width: 760px) 80vw, 40vw"
          width={853}
          height={1536}
          alt={hero.modelAlt}
          className={s.photo}
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <YarnCanvas
        preset="hero"
        className={s.canvas}
        photo={{ ref: imgRef, ...PHOTO }}
        onEngine={onEngine}
        onPhotoReady={onPhotoReady}
      />

      <div className={`container ${s.content}`}>
        <p className={s.eyebrow} data-hero-fade>
          <span className={s.eyebrowDot} />
          {hero.eyebrow}
        </p>
        <h1 id="hero-title" className={`display ${s.title}`}>
          <span className="line-mask">
            <span data-hero-line>{hero.title[0]}</span>
          </span>
          <span className="line-mask">
            <span data-hero-line>
              {hero.title[1]} <em className={`accent ${s.accentDesk}`}>{hero.accent}</em>
            </span>
          </span>
          <span className={`line-mask ${s.accentMobileLine}`}>
            <span data-hero-line>
              <em className="accent">{hero.accent}</em>
            </span>
          </span>
        </h1>
        <p className={s.subtitle} data-hero-fade>
          {hero.subtitle}
        </p>
        <div className={s.ctas} data-hero-fade>
          <a href="#colecao" className="btn btn-primary">
            {hero.ctaPrimary}
            <ArrowRight className="btn-arrow" />
          </a>
          <a
            href={waLink(defaultWaMessage)}
            className={`btn btn-ghost ${s.ctaWa}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsAppIcon size={20} />
            {hero.ctaSecondary}
          </a>
        </div>
        <ul className={s.proof} data-hero-fade>
          {hero.proof.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>

      <aside className={`glass ${s.card}`} data-hero-fade>
        <HeartLine size={22} className={s.cardIcon} />
        <span className={s.cardRule} />
        <p>{hero.card}</p>
      </aside>

      <div className={`container ${s.bandContent}`}>
        <div data-hero-band>
          <p className={s.bandEyebrow}>
            {collection.eyebrow} <span>/</span> 01 — {String(products.length).padStart(2, '0')}
            <i />
          </p>
          <p className={`display ${s.bandTitle}`}>
            {collection.title} <em className="accent">{collection.accent}</em>
          </p>
        </div>
        <ul className={s.previews} data-hero-band>
          {previews.map((p, i) => (
            <li key={p.slug} style={{ ['--i' as string]: i }}>
              <a href="#colecao" aria-label={`Ver ${p.name} na coleção`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" loading="lazy" decoding="async" width={760} height={1013} />
              </a>
            </li>
          ))}
        </ul>
        <a href="#colecao" className={s.scrollHint} data-hero-band>
          <span className={s.scrollLine} />
          {hero.scroll}
        </a>
      </div>
      <span className="sr-only">
        Atendimento pelo WhatsApp {brand.whatsapp.display}.
      </span>
    </section>
  );
}
