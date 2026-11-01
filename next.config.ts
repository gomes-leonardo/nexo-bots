import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    // Links antigos dos jogos em HTML puro
    return [{ source: '/impostor/index.html', destination: '/impostor', permanent: true }];
  },
};

export default nextConfig;
