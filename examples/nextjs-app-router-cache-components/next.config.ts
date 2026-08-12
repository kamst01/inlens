import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "dummyjson.com" },
      { protocol: "https", hostname: "cdn.dummyjson.com" },
    ],
  },
};

export default nextConfig;
