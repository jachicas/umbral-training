import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (Railway deploy)
  output: "standalone",
  experimental: {
    // Payment receipts (a photo or PDF, up to 10 MB at the API) go through a Server Action.
    serverActions: { bodySizeLimit: "11mb" },
  },
};

export default nextConfig;
