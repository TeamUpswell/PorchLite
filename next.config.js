/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Minimal webpack config
  webpack: (config) => {
    return config;
  },

  // Skip experimental features
  experimental: {},
};

module.exports = nextConfig;
