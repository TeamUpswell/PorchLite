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
};

module.exports = nextConfig;
