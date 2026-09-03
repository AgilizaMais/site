import { isImplemented } from '@/lib/content/site';
import { Hero } from '@/components/scenes/01-hero/Hero';
import { Anxiety } from '@/components/scenes/02-anxiety/Anxiety';
import { SelfEsteem } from '@/components/scenes/03-selfesteem/SelfEsteem';
import { Flexibility } from '@/components/scenes/04-flexibility/Flexibility';

/**
 * A jornada tem oito cenas (docs/CREATIVE_DIRECTION.md §3).
 * Implementadas até aqui: Cenas 1 a 4. As demais entram uma por etapa.
 *
 * As cenas seguem o registro de `implementedScenes`, que um build de prévia
 * pode encurtar (`NEXT_PUBLIC_SCENES`). Assim a página, a navegação e o
 * sumário da primeira tela contam sempre a mesma história.
 */
export default function Page() {
  return (
    <>
      <Hero />
      {isImplemented('ansiedade') && <Anxiety />}
      {isImplemented('autoestima') && <SelfEsteem />}
      {isImplemented('flexibilidade') && <Flexibility />}
    </>
  );
}
