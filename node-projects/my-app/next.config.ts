import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static optimization for development
  output: 'standalone',
  // Force full page reload on changes
  devIndicators: {
    buildActivity: true,
  },
  // Disable static optimization in development
  experimental: {
    optimizeCss: false,
  },
};

export default nextConfig;
