import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static exports
  output: 'export',
  distDir: 'dist',  
  // Disable the Image Optimization API for static exports
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
