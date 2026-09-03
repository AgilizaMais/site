import type { Metadata } from 'next';
import { professional } from './site';

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://rafaellearaujo.psi.br';

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
  robots: { index: true, follow: true },
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
