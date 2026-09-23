import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const apiOrigin = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(
  /\/$/,
  "",
);

const nextConfig: NextConfig = {
  outputFileTracingRoot: appRoot,
  turbopack: {
    root: appRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d2pqfot7du0xby.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "vkode-media-prod.s3.eu-west-3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
