import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Workspace packages ship TypeScript source; the API runs in-process (see src/lib/api.ts).
  transpilePackages: ["@luxe-hair/shared", "@luxe-hair/api", "@luxe-hair/db"],
  // pg loads pg-cloudflare's socket under workerd; Node-based file tracing would leave it out.
  outputFileTracingIncludes: { "/**": ["../../node_modules/pg-cloudflare/dist/**"] },
  experimental: {
    // Receipt photos (API caps them at 10 MB) pass through the Add Expense server action.
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;

// Gives `next dev` the Worker's bindings (local R2, Hyperdrive, .dev.vars) via getCloudflareContext.
initOpenNextCloudflareForDev();
