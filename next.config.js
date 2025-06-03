/** @type {import('next').NextConfig} */
const nextConfig = {
  // Drastically simplified config
  images: {
    domains: ["localhost", "supabase.co"],
  },

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

  // No experimental features
  experimental: {
    // Completely disable experimental features
  },
};

module.exports = nextConfig;
