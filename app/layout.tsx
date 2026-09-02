import type { Metadata, Viewport } from 'next';
import './globals.css';
import { metadata as siteMetadata, jsonLd } from '@/lib/content/meta';
import { MotionPreferenceProvider, motionBootScript } from '@/lib/motion/MotionPreferenceProvider';
import { ThemeProvider, themeBootScript } from '@/lib/theme/ThemeProvider';
import { SmoothScrollProvider } from '@/lib/motion/SmoothScrollProvider';
import { Navbar } from '@/components/ui/Navbar';
import { Cursor } from '@/components/ui/Cursor';
import { SkipLink } from '@/components/ui/SkipLink';
import { MotionFeatures } from '@/components/ui/MotionFeatures';

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: '#09090b',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Aplica a preferência de movimento antes da primeira pintura. */}
        <script dangerouslySetInnerHTML={{ __html: motionBootScript }} />
        {/* Aplica o tema salvo antes da primeira pintura, para o fundo não
            piscar do escuro para o claro. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ThemeProvider>
          <MotionPreferenceProvider>
          <MotionFeatures>
            <SmoothScrollProvider>
              <SkipLink />
              <Navbar />
              <Cursor />
              <main id="conteudo">{children}</main>
              <div className="u-vignette" aria-hidden />
              <div className="u-grain" aria-hidden />
            </SmoothScrollProvider>
          </MotionFeatures>
          </MotionPreferenceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
