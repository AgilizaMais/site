/**
 * O site é 100% estático: nenhuma rota depende de servidor.
 *
 * - `npm run build`         → build padrão (Vercel, Netlify, Node)
 * - `npm run build:static`  → gera a pasta `out/` com index.html e assets,
 *                             pronta para subir em qualquer hospedagem comum
 *                             (cPanel, Hostinger, Apache/nginx, GitHub Pages).
 *
 * BASE_PATH: preencha apenas se o site NÃO for servido na raiz do domínio.
 * Ex.: para https://dominio.com/site/, use BASE_PATH=/site
 */
const isStatic = process.env.STATIC_EXPORT === '1';
const basePath = process.env.BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  // three shipa ESM moderno; transpilar garante build estável no Next 15.
  transpilePackages: ['three'],

  ...(isStatic
    ? {
        output: 'export',
        // Sem otimizador de imagem no export estático (não há servidor para rodá-lo).
        images: { unoptimized: true },
        // Gera /pasta/index.html em vez de /pasta.html — o que Apache e nginx
        // servem sozinhos, sem regra de rewrite.
        trailingSlash: true,
        ...(basePath ? { basePath, assetPrefix: basePath } : {}),
      }
    : {}),
};

export default nextConfig;
