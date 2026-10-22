import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@luxe-hair/shared"],
  experimental: {
    // Receipt photos (API caps them at 10 MB) pass through the Add Expense server action.
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
