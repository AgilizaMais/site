import { Hero } from '@/components/scenes/01-hero/Hero';
import { Anxiety } from '@/components/scenes/02-anxiety/Anxiety';

/**
 * A jornada tem oito cenas (docs/CREATIVE_DIRECTION.md §3).
 * Implementadas até aqui: Cenas 1 e 2. As demais entram uma por etapa.
 */
export default function Page() {
  return (
    <>
      <Hero />
      <Anxiety />
    </>
  );
}
