'use client';

import { m } from 'framer-motion';
import { heroIndex, isImplemented, type SceneId } from '@/lib/content/site';
import { useMotionPreference } from '@/lib/motion/MotionPreferenceProvider';

/**
 * Sumário da jornada, no rodapé da primeira tela — só no desktop.
 *
 * Não é navegação secundária: é o índice do que o site trata, dito antes de
 * pedir qualquer rolagem. No celular ele não existe, porque ali a primeira
 * tela é a fotografia e a frase, e mais nada.
 *
 * Cada item vira link quando a cena correspondente já foi construída; as que
 * ainda não existem ficam como texto, sem âncora morta.
 */
export function HeroIndex() {
  const { reduced, resolved } = useMotionPreference();
  const d = (seconds: number) => (reduced ? 0 : seconds);

  const items = heroIndex.items.map((item) => ({
    ...item,
    href: isImplemented(item.id as SceneId) ? `#${item.id}` : null,
  }));

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={resolved ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: d(1), delay: d(2.9), ease: [0.16, 1, 0.3, 1] }}
      className="hidden md:block"
    >
      <nav
        aria-label="Temas do acompanhamento"
        className="rounded-[1.75rem] border border-hairline bg-glass px-8 py-6 backdrop-blur-[14px]"
      >
        <ul className="grid grid-cols-5 gap-8">
          {items.map(({ id, label, line, href }) => {
            const body = (
              <>
                <span className="block text-[0.9375rem] font-medium tracking-[-0.01em] text-text">
                  {label}
                </span>
                <span className="mt-1.5 block text-[0.8125rem] leading-[1.45] text-muted">
                  {line}
                </span>
              </>
            );

            return (
              <li key={id}>
                {href ? (
                  <a
                    href={href}
                    className="group block rounded-lg outline-none transition-opacity duration-300 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
                  >
                    <span className="mb-2.5 block h-px w-7 bg-accent-line transition-[width] duration-500 group-hover:w-12" />
                    {body}
                  </a>
                ) : (
                  <div>
                    <span className="mb-2.5 block h-px w-7 bg-hairline" />
                    {body}
                  </div>
                )}
              </li>
            );
          })}

          <li>
            <span className="mb-2.5 block h-px w-7 bg-hairline" />
            <span className="block text-[0.9375rem] font-medium tracking-[-0.01em] text-text">
              {heroIndex.credential.label}
            </span>
            <span className="mt-1.5 block text-[0.8125rem] leading-[1.45] text-muted">
              {heroIndex.credential.line}
            </span>
          </li>
        </ul>
      </nav>
    </m.div>
  );
}
