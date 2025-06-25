/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Ensure compatibility with Create React App paths
  reactStrictMode: false,
  // Disable server components for initial migration
  experimental: {},
  // Ensure images work properly
  images: {
    unoptimized: true,
  },
  // Configure webpack to resolve path aliases
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    return config;
  },
  // Handle the well-known path error
  async rewrites() {
    return [
      {
        source: '/.well-known/:path*',
        destination: '/api/well-known/:path*',
      },
    ];
  },
}

module.exports = nextConfig 