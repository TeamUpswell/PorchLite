/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add this images configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    largePageDataBytes: 384 * 1000, // Increase even more
    optimizeCss: false, // Disable CSS optimization
    cpus: 1, // Limit CPU usage to reduce memory pressure
  },

  // Modify webpack config
  webpack: (config, { isServer }) => {
    // Add optimization
    config.optimization.minimize = true;

    // Reduce regex complexity
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        maxInitialRequests: 25,
        minSize: 20000,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
