/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Enable modern features
  experimental: {
    // Enable app directory (if not already default)
    appDir: true,
    // Optimize server components
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    // Enable static exports optimization
    optimizePackageImports: ['lucide-react', 'react-hot-toast'],
  },

  // ✅ Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hkrgfqpshdoroimlulzw.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ✅ Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // ✅ Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // ✅ Redirects for better SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/dashboard/old',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },

  // ✅ Rewrites for API proxying
  async rewrites() {
    return [
      {
        source: '/api/maps/:path*',
        destination: 'https://maps.googleapis.com/maps/api/:path*',
      },
    ];
  },

  // ✅ Webpack optimizations
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    };

    // Add aliases for cleaner imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
    };

    // Optimize for production
    if (!dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        module: false,
      };
    }

    return config;
  },

  // ✅ Build optimization
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // ✅ Development configuration
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // ✅ TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ✅ ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['pages', 'components', 'lib', 'app'],
  },

  // ✅ Output configuration for deployment
  output: 'standalone', // Useful for Docker deployments
  
  // ✅ Trailing slash configuration
  trailingSlash: false,

  // ✅ Bundle analyzer (enable when needed)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: 'bundle-analyzer-report.html',
        })
      );
      return config;
    },
  }),
};

// ✅ Development-specific overrides
if (process.env.NODE_ENV === 'development') {
  nextConfig.experimental = {
    ...nextConfig.experimental,
    // Enable faster refresh in development
    fastRefresh: true,
  };
}

// ✅ Production-specific overrides
if (process.env.NODE_ENV === 'production') {
  nextConfig.compiler = {
    // Remove console.log in production
    removeConsole: {
      exclude: ['error', 'warn'],
    },
  };
}

module.exports = nextConfig;
