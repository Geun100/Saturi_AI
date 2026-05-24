import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'tong.visitkorea.or.kr' },
      { protocol: 'https', hostname: 'api.visitkorea.or.kr' },
    ],
  },
}

export default nextConfig
