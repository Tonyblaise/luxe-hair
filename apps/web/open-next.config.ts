import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every page reads the session cookie, so nothing needs an incremental cache.
export default defineCloudflareConfig();
