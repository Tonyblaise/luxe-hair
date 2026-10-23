# Deploying

One Cloudflare Worker (`luxe-hair`, config in `apps/web/wrangler.jsonc`) serves everything: Next.js through the OpenNext adapter, with the Hono API running in-process (`apps/web/src/lib/api.ts`), so the API has no public URL. Bindings:

| Binding | What |
| --- | --- |
| `HYPERDRIVE` | Pooled connection to the Railway Postgres. Every request opens its own Prisma client through it (`withPrisma` in `packages/db/src/index.ts`) |
| `RECEIPTS` | R2 bucket `luxe-hair-receipts` holding expense receipt photos, keyed `<companyId>/<uuid>.<ext>` |
| `JWT_SECRET` | Secret that signs salon and admin tokens |
| `WEB_ORIGIN` | The app's public URL, used in the invite and password-reset links |
| `RESEND_API_KEY` | Secret: Resend key for invite and password-reset emails. Without it nothing is emailed and the app only shows links to copy |
| `EMAIL_FROM` | Sender for those emails, e.g. `Luxe Hair <no-reply@example.com>`; its domain must be verified in Resend. Defaults to `onboarding@resend.dev`, which only delivers to the Resend account's own address |

The Worker bundle is about 3.7 MiB gzipped, above the Workers Free limit of 3 MiB, so the account needs the Workers Paid plan.

## First deploy

Sign in to both CLIs (each opens a browser):

```bash
npx wrangler login
railway login
```

**Database (Railway).** Create a project with Postgres and take its public URL (Hyperdrive and your machine reach it through Railway's TCP proxy):

```bash
railway init --name luxe-hair
railway add --database postgres
railway tcp-proxy create --port 5432 --service Postgres
railway variables --service Postgres --kv | grep DATABASE_PUBLIC_URL
```

`DATABASE_PUBLIC_URL` can lag behind the proxy; until it appears, build it as `postgresql://PGUSER:PGPASSWORD@<proxy domain>:<proxy port>/PGDATABASE` from `railway tcp-proxy list --service Postgres` and `railway variables --service Postgres`.

Apply the migrations from `packages/db`, then seed the platform data (plans, settings, the platform admin; `SEED_ADMIN_PASSWORD` sets the admin's password):

```bash
cd packages/db
DATABASE_URL="<DATABASE_PUBLIC_URL>" npx prisma migrate deploy
DATABASE_URL="<DATABASE_PUBLIC_URL>" npm run seed
```

The seed also creates the Luxe Hair demo salon and eight sample salons. Delete them from the admin console (suspend, then delete) if production shouldn't have them.

**Cloudflare resources**, from `apps/web`:

```bash
npx wrangler r2 bucket create luxe-hair-receipts
npx wrangler hyperdrive create luxe-hair-db --connection-string="<DATABASE_PUBLIC_URL>"
```

Put the Hyperdrive id it prints into `hyperdrive[0].id` in `wrangler.jsonc`, then set the signing secret (use a new value, not the local one):

```bash
openssl rand -hex 32 | npx wrangler secret put JWT_SECRET
```

For email, verify the sending domain in Resend (Domains → Add, then the DNS records it lists), set `vars.EMAIL_FROM` in `wrangler.jsonc` to an address on it, and add the API key:

```bash
npx wrangler secret put RESEND_API_KEY
```

**Deploy:**

```bash
npm run deploy
```

Set `vars.WEB_ORIGIN` in `wrangler.jsonc` to the Worker's URL, `https://<worker>.<account subdomain>.workers.dev` (or a custom domain). A new workers.dev URL can answer 404 (error 1042) for a minute after the first deploy.

## Current deployment

- Worker `luxe-hair` at https://luxe-hair.bubbablaise3.workers.dev
- Railway project `luxe-hair` (workspace "TD Harris's Projects"), service `Postgres`, public TCP proxy on port 5432
- Hyperdrive config `luxe-hair-db` (id in `wrangler.jsonc`), R2 bucket `luxe-hair-receipts`

## CI/CD (GitHub Actions)

`.github/workflows/ci.yml` runs on every push and pull request: `npm ci`, `typecheck`, `build`. On a push to `master` it then runs the `deploy` job in the `production` environment (one at a time): `prisma migrate deploy` against Railway, then `npm run deploy`. Repository secrets it needs:

| Secret | What |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | API token from the "Edit Cloudflare Workers" template (Workers Scripts, R2 and Hyperdrive on this account) |
| `CLOUDFLARE_ACCOUNT_ID` | `eea58de5cfe6181ae0486358d447622f` |
| `DATABASE_URL` | Railway's `DATABASE_PUBLIC_URL`, used only for migrations |

Worker secrets (`JWT_SECRET`, `RESEND_API_KEY`) stay in Cloudflare (`wrangler secret put`); the pipeline never sees them.

## Later deploys

Push to `master` and the pipeline deploys. By hand: `npm run deploy` from the repo root. After a schema change, run `npx prisma migrate deploy` against `DATABASE_PUBLIC_URL` before deploying the code that needs it. After editing `wrangler.jsonc` bindings, run `npm run cf-typegen -w @luxe-hair/web` to refresh `cloudflare-env.d.ts`.

## Local

- `npm run dev` runs `next dev` with the Worker's bindings from wrangler: R2 is emulated in `apps/web/.wrangler/state`, and Hyperdrive connects straight to `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` in `apps/web/.env`.
- `npm run preview` builds the Worker and runs it in local workerd on :8787, which is the closest check to production.

Secrets go in `apps/web/.dev.vars` locally and `wrangler secret put` in production, never in `.env` files: OpenNext bundles every `.env*` file into the Worker.
