import { Hero } from '@/components/scenes/01-hero/Hero';
import { Anxiety } from '@/components/scenes/02-anxiety/Anxiety';
import { SelfEsteem } from '@/components/scenes/03-selfesteem/SelfEsteem';
import { Flexibility } from '@/components/scenes/04-flexibility/Flexibility';

/**
 * A jornada tem oito cenas (docs/CREATIVE_DIRECTION.md §3).
 * Implementadas até aqui: Cenas 1 a 4. As demais entram uma por etapa.
 */
export default function Page() {
  return (
    <>
      <Hero />
      <Anxiety />
      <SelfEsteem />
      <Flexibility />
    </>
  );
}
