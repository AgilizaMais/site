import { brand, realLife } from '@/lib/content';
import { SectionTitle } from '@/components/SectionTitle';
import { InstagramIcon } from '@/components/Icons';
import s from './RealLife.module.css';

export function RealLife() {
  const row = [...realLife.photos, ...realLife.photos];
  return (
    <section className={s.section} aria-labelledby="vida-real-title">
      <div className={`container ${s.head}`}>
        <SectionTitle id="vida-real-title" eyebrow={realLife.eyebrow} title={realLife.title} accent={realLife.accent} />
        <a href={brand.instagram.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" data-reveal>
          <InstagramIcon /> {realLife.cta}
        </a>
      </div>
      <div className={s.marquee}>
        <ul className={s.track}>
          {row.map((p, i) => (
            <li key={i} className={s.item} aria-hidden={i >= realLife.photos.length}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={i >= realLife.photos.length ? '' : p.alt} loading="lazy" decoding="async" width={760} height={1013} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
