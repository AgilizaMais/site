import { faq } from '@/lib/content';
import { SectionTitle } from '@/components/SectionTitle';
import { PlusIcon } from '@/components/Icons';
import s from './Faq.module.css';

export function Faq() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  };
  return (
    <section id="duvidas" className={s.section} aria-labelledby="faq-title">
      <div className={`container ${s.grid}`}>
        <SectionTitle id="faq-title" eyebrow={faq.eyebrow} title={faq.title} accent={faq.accent} />
        <div className={s.list}>
          {faq.items.map((item, i) => (
            <details key={item.q} className={s.item} data-reveal open={i === 0}>
              <summary>
                <span>{item.q}</span>
                <PlusIcon className={s.icon} />
              </summary>
              <div className={s.answer}>
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </section>
  );
}
