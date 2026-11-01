import type { Metadata, Viewport } from 'next';
import { Fraunces, Outfit, Allura } from 'next/font/google';
import './globals.css';
import { brand } from '@/lib/content';
import { SmoothScroll } from '@/lib/motion/SmoothScroll';
import { Header } from '@/components/Header';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';
import { Preloader } from '@/components/Preloader';

const display = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz', 'SOFT'],
  variable: '--font-display',
  display: 'swap',
});

const ui = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-ui',
  display: 'swap',
});

const script = Allura({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-script',
  display: 'swap',
});

const title = 'Edclebia Crochê — Feito à mão. Feito para marcar.';
const description =
  'Vestidos, moda praia, tops e peças especiais em crochê, feitos à mão e sob medida pela artesã Edclebia. Encomende pelo WhatsApp.';

export const metadata: Metadata = {
  metadataBase: new URL(`${brand.siteUrl}/`),
  title,
  description,
  keywords: [
    'crochê',
    'vestido de crochê',
    'moda praia crochê',
    'crochê sob medida',
    'saída de praia crochê',
    'crochê artesanal',
    'Alagoas',
    'Maceió',
  ],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    title,
    description,
    siteName: brand.name,
    url: `${brand.siteUrl}/`,
    images: [{ url: `${brand.siteUrl}/og.jpg`, width: 1200, height: 630, alt: brand.name }],
  },
  twitter: { card: 'summary_large_image', title, description, images: [`${brand.siteUrl}/og.jpg`] },
  alternates: { canonical: `${brand.siteUrl}/` },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#fcefe9',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  name: brand.name,
  description,
  url: `${brand.siteUrl}/`,
  telephone: `+${brand.whatsapp.number}`,
  image: `${brand.siteUrl}/og.jpg`,
  logo: `${brand.siteUrl}/img/logo.webp`,
  sameAs: [brand.instagram.url],
  address: { '@type': 'PostalAddress', addressRegion: 'AL', addressCountry: 'BR' },
  priceRange: '$$',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`no-js ${display.variable} ${ui.variable} ${script.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.replace('no-js','js')",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <SmoothScroll>
          <Preloader />
          <Header />
          <main id="conteudo">{children}</main>
          <FloatingWhatsApp />
        </SmoothScroll>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
