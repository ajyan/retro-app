/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure compatibility with Create React App paths
  reactStrictMode: false,
  // Disable server components for initial migration
  experimental: {},
  // Ensure images work properly
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig 