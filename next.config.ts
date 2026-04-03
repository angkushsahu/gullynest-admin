import type { NextConfig } from "next";
import { validateEnv } from "./lib/env";

validateEnv();

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
