# Luxe Hair

Salon manager: dashboard, sales log, services, reports, tasks, employees, team, payouts, expenses and inventory. One responsive app (desktop sidebar, tablet top bar, phone drawer) built from the Claude Design "Salon Manager" file; see `docs/design-spec.md`.

npm workspaces + Turborepo monorepo:

| Path | What |
| --- | --- |
| `apps/api` | Hono API on port 4000 (JWT auth, company-scoped routes, receipt uploads) |
| `apps/web` | Next.js 16 app on port 3000 |
| `packages/db` | Prisma 7 schema, migrations, seed, configured client |
| `packages/shared` | Zod schemas, labels, date and money helpers shared by everything |
| `docs/design-spec.md` | Design tokens, components and per-screen spec |
| `docs/admin-spec.md` | Platform admin console spec (`/admin`) |

## Setup

Needs Node 22 and a local Postgres.

```bash
npm install
createdb luxe_hair
cp packages/db/.env.example packages/db/.env   # set DATABASE_URL, SEED_OWNER_PASSWORD and SEED_ADMIN_PASSWORD
cp apps/api/.env.example apps/api/.env         # set DATABASE_URL and JWT_SECRET (openssl rand -hex 32)
cp apps/web/.env.example apps/web/.env.local
npm run db:migrate
npm run db:seed
npm run dev                                    # api :4000 + web :3000
```

`db:seed` wipes and rebuilds the Luxe Hair salon with about 12 months of sales, expenses and payouts, plus the platform data: three plans, settings, eight sample salons in every status, and a platform admin. Sign in to the salon app as `owner@luxehair.test`; the managers and front desk (`daniel@`, `mia@`, `ruth@luxehair.test`) use the same `SEED_OWNER_PASSWORD`. Sign in to the admin console at `/admin` as `admin@salonmanager.test` with `SEED_ADMIN_PASSWORD`.

## Admin console

`/admin` is the platform owner's console across all salons: invite companies (the owner gets a link that starts a free trial), change plans, suspend or reactivate (suspension signs the salon out and blocks sign-in), delete suspended companies, send owner password-reset links, and edit platform settings and plan pricing. Plan employee limits are enforced in the salon app. It has its own sign-in and cookie, separate from salon accounts.

## Scripts

`npm run dev` · `build` · `typecheck` · `db:migrate` · `db:seed` · `db:studio` · `db:generate`

## How auth works

- Sign-in returns a JWT (HS256, 90 days) with `sub`, `company_id`, `role`, `iat`, `exp`. Nothing is stored server-side.
- `requireAuth` verifies the token, loads the User, and rejects deleted, banned or not-yet-joined users and tokens issued before `users.tokens_valid_after`.
- Moving `tokens_valid_after` forward signs a user out everywhere: sign out everywhere, password change (this device gets a fresh token), and removal from the team.
- Team invites are 7-day single-use links (`/accept-invite?token=…`). There's no email service yet, so the app shows the link to copy and send.
- Every query takes `companyId` from the verified token, never from the request.
- The web app keeps the token in an httpOnly cookie and calls the API only from the server, through a typed Hono client (`apps/web/src/lib/api.ts`).

## Adding a screen

1. Zod schema in `packages/shared/src/index.ts`.
2. Route file in `apps/api/src/routes/`, mounted in `apps/api/src/app.ts` (chain the `.route()` so the typed client sees it).
3. `page.tsx`, `actions.ts` and client components in `apps/web/src/app/(app)/<screen>/`, using the primitives in `apps/web/src/components/ui` and `PageHeader`/`PageBody` from `components/shell/page.tsx`.
