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
};

export default nextConfig;
