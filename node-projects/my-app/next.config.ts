import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable the Image Optimization API for static exports
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
