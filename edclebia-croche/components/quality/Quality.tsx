import { quality } from '@/lib/content';
import { SectionTitle } from '@/components/SectionTitle';
import { PillarIcon } from '@/components/Icons';
import s from './Quality.module.css';

const words = ['feito à mão', 'sob medida', 'peça única', 'ponto a ponto', 'com amor', 'identidade'];

export function Quality() {
  return (
    <section id="qualidade" className={s.section} aria-labelledby="qualidade-title">
      <div className={s.marquee} aria-hidden>
        <div className={s.marqueeTrack}>
          {[0, 1].map((k) => (
            <span key={k} className={s.marqueeGroup}>
              {words.map((w) => (
                <span key={w} className={s.word}>
                  {w}
                  <svg viewBox="0 0 24 24" className={s.sep}>
                    <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z" />
                  </svg>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className={`container ${s.grid}`}>
        <figure className={s.figure} data-reveal>
          <div className={s.arch}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/colecao/vestido-sereia.webp"
              alt="Vestido sereia de manga longa em crochê off-white, com barra em leque"
              loading="lazy"
              decoding="async"
              width={760}
              height={1013}
            />
          </div>
          {/* pesponto: o "fio" que costura a moldura */}
          <svg className={s.stitch} viewBox="0 0 400 540" preserveAspectRatio="none" aria-hidden>
            <path d="M12 528 V200 A188 188 0 0 1 388 200 V528 Z" />
          </svg>
          <figcaption className={`glass ${s.badge}`}>
            <strong>100%</strong>
            <span>feito à mão, ponto a ponto</span>
          </figcaption>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={s.detail}
            src="/img/colecao/top-gotas-douradas.webp"
            alt="Detalhe de top em crochê com paetês dourados"
            loading="lazy"
            decoding="async"
            width={760}
            height={840}
          />
        </figure>

        <div className={s.copy}>
          <SectionTitle id="qualidade-title" eyebrow={quality.eyebrow} title={quality.title} accent={quality.accent} />
          <p className="lead" data-reveal style={{ marginTop: '1.4rem' }}>
            {quality.intro}
          </p>
          <ul className={s.pillars}>
            {quality.pillars.map((p) => (
              <li key={p.title} className={s.pillar} data-reveal>
                <span className={s.icon}>
                  <PillarIcon name={p.icon} />
                </span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
