import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Login credentials are submitted through a Server Action. Disable Next.js
  // development request logging so action arguments never reach the terminal.
  logging: false,
  reactStrictMode: true,
};

export default nextConfig;
