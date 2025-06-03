/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Generate static HTML files
  images: {
    unoptimized: true, // Required for static export
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
