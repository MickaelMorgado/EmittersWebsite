import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static exports
  output: 'export',
  distDir: 'dist',
  
  // Optional: Add a trailing slash to all paths for better compatibility
  trailingSlash: true,
  
  // Disable the Image Optimization API for static exports
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
