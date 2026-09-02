'use client';

import { useLayoutEffect, useRef } from 'react';
import { gsap, registerGsap } from '@/lib/motion/gsap';
import { D, STAGGER } from '@/lib/motion/durations';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';

type Props = {
  lines: readonly string[];
  as?: 'h1' | 'h2' | 'p';
  className?: string;
  /** Atraso, em segundos, a partir da montagem. */
  delay?: number;
  /** Quando false, a animação aguarda (usado pela timeline do Hero). */
  play?: boolean;
  id?: string;
};

/**
 * Reveal por linha com clip-path — nunca opacity isolada, que rouba peso
 * tipográfico das headlines. docs/ANIMATION_SYSTEM.md §3
 *
 * As linhas são quebradas manualmente no conteúdo (não por medição em runtime),
 * o que elimina layout shift e mantém o texto legível sem JS.
 */
export function RevealLines({
  lines,
  as: Tag = 'h2',
  className = '',
  delay = 0,
  play = true,
  id,
}: Props) {
  const root = useRef<HTMLElement>(null);
  const { reduced } = useMotionPreference();

  useLayoutEffect(() => {
    if (!play) return;
    const el = root.current;
    if (!el) return;

    registerGsap();
    const ctx = gsap.context(() => {
      const targets = el.querySelectorAll('[data-line-inner]');
      if (reduced) {
        gsap.set(targets, { clipPath: 'inset(0 0 0% 0)', yPercent: 0, opacity: 1 });
        return;
      }
      gsap.fromTo(
        targets,
        { clipPath: 'inset(0 0 100% 0)', yPercent: 34, opacity: 0 },
        {
          clipPath: 'inset(0 0 0% 0)',
          yPercent: 0,
          opacity: 1,
          duration: D.slow,
          ease: 'outExpo',
          stagger: STAGGER.lines,
          delay,
        },
      );
    }, el);

    return () => ctx.revert();
  }, [play, delay, reduced]);

  return (
    <Tag id={id} ref={root as never} className={className}>
      {lines.map((line) => (
        <span key={line} className="block overflow-hidden pb-[0.08em]">
          <span data-line-inner className="block will-change-transform">
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}
