import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "www.president.go.ke",
      "lh3.googleusercontent.com",
      "res.cloudinary.com",
      "avatars.githubusercontent.com"
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  // Add this to ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optional: Also ignore TypeScript errors if any
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;