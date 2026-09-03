import type { Metadata } from 'next';
import { professional } from './site';

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rafaellearaujo.psi.br';

/**
 * Build de prévia — um recorte de cenas para mostrar uma etapa antes das
 * outras existirem (ver `implementedScenes` em `site.ts`).
 *
 * Uma prévia hospedada num domínio de verdade não pode ser indexada: seria um
 * site incompleto, com o nome e o CRP dela, aparecendo na busca. O `noindex`
 * sai automaticamente do mesmo sinal que corta as cenas, para ninguém ter de
 * lembrar de ligá-lo.
 */
const isPreview = Boolean(process.env.NEXT_PUBLIC_SCENES);

const description =
  'Psicologia clínica com abordagem em Terapia Cognitivo-Comportamental. Ansiedade, autoestima, flexibilidade psicológica e aceitação.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${professional.name} — ${professional.role} · ${professional.crp}`,
    template: `%s — ${professional.name}`,
  },
  description,
  applicationName: professional.name,
  authors: [{ name: professional.name }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: professional.name,
    title: `${professional.name} — ${professional.role}`,
    description,
  },
  twitter: { card: 'summary_large_image', title: professional.name, description },
  robots: isPreview ? { index: false, follow: false } : { index: true, follow: true },
};

/**
 * JSON-LD sem aggregateRating e sem qualquer alegação de resultado —
 * exigência do Código de Ética (docs/PRD.md §9).
 */
export const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Psychologist',
  name: professional.name,
  jobTitle: professional.role,
  identifier: professional.crp,
  url: siteUrl,
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'PUCRS' },
  knowsAbout: [
    'Terapia Cognitivo-Comportamental',
    'Manejo da ansiedade',
    'Autoestima',
    'Flexibilidade psicológica',
    'Aceitação',
  ],
  areaServed: 'BR',
  inLanguage: 'pt-BR',
} as const;
