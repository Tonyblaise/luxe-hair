import type { User } from "@luxe-hair/db";

/** Cloudflare bindings, declared in apps/web/wrangler.jsonc. */
export type Bindings = {
  HYPERDRIVE: Hyperdrive;
  RECEIPTS: R2Bucket;
  JWT_SECRET: string;
  /** Public origin of the app, used in the links the API emails and hands back. */
  WEB_ORIGIN?: string;
  /** Resend API key (secret). Without it, emails are logged in development instead of sent. */
  RESEND_API_KEY?: string;
  /** Sender for every email, e.g. "Luxe Hair <no-reply@example.com>"; its domain must be verified in Resend. */
  EMAIL_FROM?: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    user: User;
    companyId: string;
  };
};
