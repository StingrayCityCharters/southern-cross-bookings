import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["mysql2"],
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "10.211.12.48",
    "10.101.10.48",
    "192.168.108.134",
    "192.168.1.235",
    "100.64.100.6",
  ],
};

export default nextConfig;
