import { Hero } from '@/components/hero/Hero';
import { Collection } from '@/components/collection/Collection';
import { Quality } from '@/components/quality/Quality';
import { Process } from '@/components/process/Process';
import { Story } from '@/components/story/Story';
import { RealLife } from '@/components/reallife/RealLife';
import { Faq } from '@/components/faq/Faq';
import { FinalCta } from '@/components/cta/FinalCta';
import { Reveals } from '@/components/Reveals';

/**
 * Jornada: abriu (hero) → viu a qualidade (coleção, o ponto) → encomendou (sob medida + WhatsApp).
 */
export default function Page() {
  return (
    <>
      <Hero />
      <Collection />
      <Quality />
      <Process />
      <Story />
      <RealLife />
      <Faq />
      <FinalCta />
      <Reveals />
    </>
  );
}
