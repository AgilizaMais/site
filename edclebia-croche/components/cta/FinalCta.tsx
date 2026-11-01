import { brand, defaultWaMessage, finalCta, nav, waLink } from '@/lib/content';
import { InstagramIcon, WhatsAppIcon } from '@/components/Icons';
import s from './FinalCta.module.css';
import { asset } from '@/lib/asset';

const WAVES = [
  { d: 'M-50 120 C 200 40, 420 200, 720 110 S 1180 30, 1500 120', c: '#e8447c', dark: '#b8255b', w: 6 },
  { d: 'M-50 190 C 260 260, 500 90, 760 170 S 1200 260, 1500 160', c: '#7a5bc9', dark: '#523a9c', w: 5 },
  { d: 'M-50 60 C 300 120, 560 10, 860 70 S 1250 140, 1500 50', c: '#f49ab9', dark: '#d9739a', w: 3.5 },
];

export function FinalCta() {
  return (
    <>
      <section className={`on-dark ${s.section}`} aria-labelledby="cta-title">
        <svg className={s.waves} viewBox="0 0 1440 280" preserveAspectRatio="none" aria-hidden>
          {WAVES.map((w, i) => (
            <g key={i} className={s.wave} style={{ animationDelay: `${-i * 2}s` }}>
              <path d={w.d} stroke={w.c} strokeWidth={w.w} />
              <path d={w.d} stroke={w.dark} strokeWidth={w.w} strokeDasharray="2 4" className={s.twist} />
              <path d={w.d} stroke="rgba(255,230,240,.55)" strokeWidth={w.w * 0.22} strokeDasharray="3 3" className={s.twist} />
            </g>
          ))}
        </svg>
        <div className={`container ${s.inner}`}>
          <h2 id="cta-title" className={`display ${s.title}`} data-reveal-lines>
            <span className="line-mask">
              <span>
                {finalCta.title} <em className="accent">{finalCta.accent}</em>
              </span>
            </span>
          </h2>
          <p className="lead" data-reveal>
            {finalCta.text}
          </p>
          <div className={s.actions} data-reveal>
            <a href={waLink(defaultWaMessage)} target="_blank" rel="noopener noreferrer" className={`btn btn-wa ${s.big}`}>
              <WhatsAppIcon size={24} />
              {finalCta.button}
            </a>
            <a href={`tel:+${brand.whatsapp.number}`} className={s.phone}>
              {brand.whatsapp.display}
            </a>
          </div>
        </div>
      </section>

      <footer className={`on-dark ${s.footer}`}>
        <div className={`container ${s.footGrid}`}>
          <div className={s.brandCol}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset('/img/logo.webp')} alt={brand.name} width={600} height={383} className={s.logo} loading="lazy" />
            <p>Crochê autoral feito à mão em {brand.region}.</p>
          </div>
          <nav aria-label="Rodapé">
            <ul className={s.links}>
              {nav.map((n) => (
                <li key={n.id}>
                  <a href={`#${n.id}`}>{n.label}</a>
                </li>
              ))}
              <li>
                <a href="#duvidas">Dúvidas</a>
              </li>
            </ul>
          </nav>
          <div className={s.contact}>
            <a href={waLink(defaultWaMessage)} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon size={18} /> {brand.whatsapp.display}
            </a>
            <a href={brand.instagram.url} target="_blank" rel="noopener noreferrer">
              <InstagramIcon size={18} /> {brand.instagram.handle}
            </a>
          </div>
        </div>
        <div className={`container ${s.bottom}`}>
          <span>© {new Date().getFullYear()} {brand.name}. Todos os direitos reservados.</span>
          <span>Feito à mão, ponto a ponto 💗</span>
        </div>
      </footer>
    </>
  );
}
