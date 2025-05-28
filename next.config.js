/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "standalone",
  images: {
    domains: [
      "placehold.co",
      "images.unsplash.com",
      "lh3.googleusercontent.com",
      "maps.googleapis.com",
      "plus.unsplash.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["pg"],
    // Remove appDir - it's deprecated in Next.js 14
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
