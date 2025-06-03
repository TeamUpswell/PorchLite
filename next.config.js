/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "localhost",
      },
      // Simplify by using just one wildcard pattern for all Supabase URLs
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
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
    // Add this to help with the micromatch issue
    largePageDataBytes: 128 * 1000, // Increase from default
  },

  env: {
    APP_NAME: "PorchLite",
    APP_DESCRIPTION: "Property Management Platform",
  },
};

module.exports = nextConfig;
