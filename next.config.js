/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "hkrgfqpshdoroimlulzw.supabase.co", // Your actual Supabase hostname
      },
      {
        protocol: "https",
        hostname: "*.supabase.co", // Wildcard for any Supabase domain
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  eslint: {
    // Ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },

  // Optimize webpack for build
  webpack: (config, { isServer }) => {
    // Reduce complexity for the micromatch issue
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    // Optimize build performance
    config.optimization = {
      ...config.optimization,
      moduleIds: "deterministic",
    };

    return config;
  },
  // Reduce build complexity
  experimental: {
    optimizeCss: false,
    optimizePackageImports: [],
  },
  env: {
    APP_NAME: "PorchLite",
    APP_DESCRIPTION: "Property Management Platform",
  },
};

module.exports = nextConfig;
