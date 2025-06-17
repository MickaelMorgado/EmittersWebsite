import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static exports
  output: 'export',
  
  // Optional: Add a trailing slash to all paths for better compatibility
  trailingSlash: true,
  
  // Disable the Image Optimization API for static exports
  images: {
    unoptimized: true,
  },
  
  // Remove deprecated devIndicators
  // Remove the experimental section as it's not needed for production
};

export default nextConfig;
