/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  // three/drei shipam ESM moderno; transpilar garante build estável no Next 15.
  transpilePackages: ['three'],
};

export default nextConfig;
