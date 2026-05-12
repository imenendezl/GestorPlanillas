import type { NextConfig } from "next";

const devAllowedOrigins = process.env.DEV_SERVER_ALLOWED_ORIGINS?.split(
  ",",
).map((origin) => origin.trim());

const nextConfig: NextConfig = {
  allowedDevOrigins: devAllowedOrigins,
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      allowedOrigins: devAllowedOrigins,
    },
  },
};

export default nextConfig;
