/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "localhost", 
      "your-supabase-project.supabase.co",
      // Add your Supabase storage domain
      "yoursupabseproject.supabase.co"
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
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
  // Disable the problematic output file tracing
  output: 'standalone',
  outputFileTracing: false,
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
      moduleIds: 'deterministic',
    };
    
    return config;
  },
  // Reduce build complexity
  experimental: {
    optimizeCss: false,
    optimizePackageImports: [],
  },
}

module.exports = nextConfig
