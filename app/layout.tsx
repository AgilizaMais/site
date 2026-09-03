import type { Metadata, Viewport } from "next";
import "./globals.css";
import { metadata as siteMetadata, jsonLd } from "@/lib/content/meta";
import {
  MotionPreferenceProvider,
  motionBootScript,
} from "@/lib/motion/MotionPreferenceProvider";
import { SmoothScrollProvider } from "@/lib/motion/SmoothScrollProvider";
import { Navbar } from "@/components/ui/Navbar";
import { Cursor } from "@/components/ui/Cursor";
import { SkipLink } from "@/components/ui/SkipLink";
import { MotionFeatures } from "@/components/ui/MotionFeatures";
import { Controls } from "@/components/ui/Controls";
import { ScrollSpeedLimit } from "@/components/ui/ScrollSpeedLimit";

export const metadata: Metadata = siteMetadata;

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Aplica a preferência de movimento antes da primeira pintura. */}
        <script dangerouslySetInnerHTML={{ __html: motionBootScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <MotionPreferenceProvider>
          <MotionFeatures>
            <SmoothScrollProvider>
              <ScrollSpeedLimit />
              <SkipLink />
              <Navbar />
              <Cursor />
              <main id="conteudo">{children}</main>

              {/* No mobile a navbar não tem espaço para os controles, e o de
                  movimento é acessibilidade: fica num agrupamento próprio,
                  fora do caminho da leitura. */}
              <Controls
                compact
                className="fixed bottom-4 right-4 z-50 flex rounded-full border border-hairline bg-glass px-3.5 py-2 backdrop-blur-[14px] md:hidden"
              />
              <div className="u-vignette" aria-hidden />
              <div className="u-grain" aria-hidden />
            </SmoothScrollProvider>
          </MotionFeatures>
        </MotionPreferenceProvider>
      </body>
    </html>
  );
}
