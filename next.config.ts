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
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8"
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
