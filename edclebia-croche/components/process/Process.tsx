'use client';

import { useEffect, useRef } from 'react';
import { processSteps } from '@/lib/content';
import { gsap, registerGsap } from '@/lib/motion/gsap';
import { SectionTitle } from '@/components/SectionTitle';
import { Builder } from './Builder';
import s from './Process.module.css';

const THREAD = 'M0 60 C 120 10, 220 110, 340 60 S 560 10, 640 60 S 860 110, 940 60 S 1120 10, 1200 60';

export function Process() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    registerGsap();
    const el = root.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      // o fio que liga as etapas é "costurado" conforme o scroll
      el.querySelectorAll<SVGPathElement>('[data-thread]').forEach((path) => {
        const len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(path, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: { trigger: '[data-steps]', start: 'top 75%', end: 'bottom 55%', scrub: 0.6 },
        });
      });
      gsap.from('[data-step-n]', {
        scale: 0.4,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'back.out(2)',
        scrollTrigger: { trigger: '[data-steps]', start: 'top 70%' },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="sob-medida" className={s.section} aria-labelledby="sob-medida-title">
      <div className={`container ${s.head}`}>
        <SectionTitle id="sob-medida-title" eyebrow={processSteps.eyebrow} title={processSteps.title} accent={processSteps.accent} />
        <p className="lead" data-reveal>
          {processSteps.intro}
        </p>
      </div>

      <div className={`container ${s.stepsWrap}`} data-steps>
        <svg className={s.threadH} viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden>
          <defs>
            <mask id="thread-draw" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="120">
              <path data-thread d={THREAD} fill="none" stroke="#fff" strokeWidth="40" />
            </mask>
          </defs>
          <g mask="url(#thread-draw)">
            <path className={s.threadShadow} d={THREAD} />
            <path className={s.threadBase} d={THREAD} />
            <path className={s.threadTwist} d={THREAD} />
            <path className={s.threadShine} d={THREAD} />
          </g>
        </svg>
        <ol className={s.steps}>
          {processSteps.steps.map((st) => (
            <li key={st.n} className={s.step} data-reveal>
              <span className={s.n} data-step-n>
                {st.n}
              </span>
              <h3>{st.title}</h3>
              <p>{st.text}</p>
            </li>
          ))}
        </ol>
      </div>

      <Builder />
    </section>
  );
}
