import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// publicado em useagilizai.com/edclebiacroche
const basePath = '/edclebiacroche';

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  trailingSlash: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // este projeto vive numa subpasta do repositório: a raiz do workspace é esta pasta
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // Export estático: o site vira HTML/CSS/JS puro e roda em qualquer hospedagem
  // (Vercel, Netlify, Hostinger, GitHub Pages…).
  output: 'export',
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  transpilePackages: ['three'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
};

export default nextConfig;
