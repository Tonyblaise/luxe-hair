# Luxe Hair

A multi-tenant salon manager. Each salon runs its day from one app: the front desk logs sales and checks clients in, managers track staff commission and pay it out weekly, and owners see revenue, expenses, profit and stock in one place. A platform admin console at `/admin` onboards salons, manages plans and handles suspensions.

Built for salons in Kenya: money is in KES, M-Pesa is a payment method, and "today" is Africa/Nairobi time.

## Features

**Salon app**: one responsive layout (sidebar on desktop, top bar on tablet, drawer on phone), built from the Claude Design "Salon Manager" file.

| Screen | What it does |
| --- | --- |
| Dashboard | Today's revenue and estimated profit, today's appointments with one-tap check-in, payouts owed, low-stock alerts, open tasks and reminders |
| Sales | Log each service sold: client, stylist, price and payment method (card, cash, M-Pesa) |
| Services | The salon's menu, with each service's price and commission (percent or flat) |
| Employees | Stylists and staff (full-time or contractor), the services each one performs, active or inactive; fields save as you type |
| Payouts | Commission owed to each employee per pay week (Monday to Sunday), marked paid by an owner or manager |
| Expenses | Expense log by category (rent and utilities, products and supplies, payroll, marketing, equipment), receipt photos, monthly recurring expenses |
| Inventory | Retail and back-bar products with cost, sell price, stock on hand and a reorder level that flags low stock |
| Tasks | Tasks and reminders, one-off or repeating daily, weekly or monthly |
| Reports | Sales vs expenses by month, profit and margin, best month, and breakdowns by service, employee and expense category |
| Team | Invite people by email as Manager, Front Desk or Accountant; resend invites or remove members |
| Account | Your details, password change, sign out everywhere |

**Admin console** (`/admin`): invite salons (the owner's link starts a free trial), move them between trial, active and suspended, change plans, delete suspended salons with all their data, send owners password-reset links, and edit platform settings and plan pricing. Each plan's employee limit is enforced in the salon app. Admins have their own sign-in, separate from salon accounts.

Salons join through an admin invite. Self-serve sign-up exists but is switched off (`SIGNUP_OPEN` in `packages/shared`).

## Stack

- **Web**: Next.js 16 (App Router, server components and server actions), Tailwind 4
- **API**: Hono, called in-process by the web app, so it has no public URL
- **Data**: Prisma 7 on Postgres
- **Email**: Resend with React Email templates
- **Hosting**: one Cloudflare Worker via OpenNext; Postgres on Railway through Hyperdrive; receipt photos in R2

npm workspaces and Turborepo:

| Path | What |
| --- | --- |
| `apps/api` | Hono API: JWT auth, company-scoped routes, R2 receipts, email |
| `apps/web` | Next.js app and the Worker config (`wrangler.jsonc`) |
| `packages/db` | Prisma schema, migrations, seed, per-request client |
| `packages/shared` | Zod schemas, labels, date and money helpers used everywhere |
| `docs/design-spec.md` | Design tokens, components and per-screen spec for the salon app |
| `docs/admin-spec.md` | Spec for the admin console |
| `docs/deploy.md` | Production setup and deploy runbook |

## Getting started

Needs Node 22 (`.nvmrc`) and a local Postgres.

```bash
npm install
createdb luxe_hair
cp packages/db/.env.example packages/db/.env         # DATABASE_URL, SEED_OWNER_PASSWORD, SEED_ADMIN_PASSWORD
cp apps/web/.env.example apps/web/.env               # local Postgres URL for the Hyperdrive binding (not secret)
cp apps/web/.dev.vars.example apps/web/.dev.vars     # JWT_SECRET (openssl rand -hex 32), RESEND_API_KEY; secrets go here, never in .env
npm run db:migrate
npm run db:seed
npm run dev                                          # http://localhost:3000, with local R2 and Hyperdrive from wrangler
```

`apps/web/.env` is bundled into the Worker, so keep secrets in `.dev.vars` only. Its Postgres URL must include a password (any value), or wrangler silently drops every binding.

### Demo data

`db:seed` rebuilds the Luxe Hair salon with about 12 months of sales, expenses and payouts, and adds the platform data: three plans, settings, eight sample salons (one in each status) and a platform admin. Other salons in the database are left alone.

| Sign in at | As | Password |
| --- | --- | --- |
| `/login` | `owner@luxehair.test`, or `daniel@`, `mia@`, `ruth@luxehair.test` for the managers and front desk | `SEED_OWNER_PASSWORD` |
| `/admin` | `admin@salonmanager.test` | `SEED_ADMIN_PASSWORD` |

## Scripts

Run from the repo root.

| Command | What |
| --- | --- |
| `npm run dev` | Next dev server on :3000 with local Worker bindings |
| `npm run typecheck` | `tsc --noEmit` in every workspace; the only check for now (no tests or linter yet) |
| `npm run build` | Next production build |
| `npm run preview` | Builds the Worker and runs it in local workerd on :8787, closest to production |
| `npm run deploy` | Builds and deploys the Worker |
| `npm run db:migrate` | Create and apply a migration after a schema change |
| `npm run db:generate` | Regenerate the Prisma client |
| `npm run db:seed` | Load the demo data |
| `npm run db:studio` | Prisma Studio |
| `npm run email -w @luxe-hair/api` | Preview the email templates on :3001 |

## How it works

### Multi-tenancy

Every salon is a `Company`, and every salon table has a `companyId`. The API takes `companyId` from the verified token, never from the request, and updates and deletes match on `{ id, companyId }`, so another salon's records look like they don't exist. Ids in a request body (a sale's stylist, an employee's services) are checked against the salon first.

### Auth

- Sign-in returns a stateless JWT (HS256, 90 days) with `sub`, `company_id`, `role`, `iat` and `exp`. Nothing is stored server-side.
- `requireAuth` verifies the token, loads the user, and rejects deleted, banned and not-yet-joined users, users of a suspended salon, and tokens issued before `users.tokens_valid_after`.
- Moving `tokens_valid_after` forward signs a user out on every device: sign out everywhere, password change (this device gets a fresh token), and removal from the team.
- Team invites are 7-day single-use links (`/accept-invite?token=…`) and password resets last an hour. Both are emailed and also shown to copy. Forgot-password requests give the same answer whether or not the account exists.
- The token lives in an httpOnly `lh_token` cookie. The browser never calls the API: server components and actions call it through a typed Hono client (`apps/web/src/lib/api.ts`) that runs the Hono app in-process.
- `/admin` is for platform admins only. The proxy checks the `lh_admin` token's signature and purpose before any admin page or action runs, and every `/platform` API route checks it again, including revocation.

### Roles and permissions

Every salon login is a team member with one of four roles: **Owner**, **Manager**, **Front Desk** or **Accountant**. The role is on `team_members.role` and in the JWT. Employees (the stylists on the Employees screen) are records, not logins.

What each role can do, screen by screen:

| Screen | Owner | Manager | Front Desk | Accountant |
| --- | :-: | :-: | :-: | :-: |
| Dashboard, Sales, Services, Reports, Tasks | ✓ | ✓ | ✓ | ✓ |
| Employees, Expenses, Inventory | ✓ | ✓ | ✓ | ✓ |
| Payouts: view the week | ✓ | ✓ | ✓ | ✓ |
| Payouts: mark as paid | ✓ | ✓ | | |
| Team: view members | ✓ | ✓ | ✓ | ✓ |
| Team: invite, resend an invite, remove a member | ✓ | ✓ | | |
| Account: edit own details, change password, sign out everywhere | ✓ | ✓ | ✓ | ✓ |
| Admin console (`/admin`) | | | | |

- `requireManager` (`apps/api/src/middleware/auth.ts`) is the only role check. It guards `POST /payouts/pay` and the team invite, resend and remove routes, and returns 403 to anyone but an owner or manager. The Team page also hides those controls from other roles, but the API is what enforces it.
- Each salon has exactly one owner, created at signup or when an invited company is accepted. Invites offer only Manager, Front Desk and Accountant (`INVITABLE_ROLES` in `packages/shared`), and a role can't be changed after the invite.
- The owner can't be removed, and nobody can remove themselves. Removing someone who hasn't joined yet deletes the invite; removing someone who has joined soft-deletes them (their history stays) and signs them out everywhere.
- Some limits apply to every role. A suspended salon is signed out and can't sign in. Adding or reactivating an employee beyond the plan's `employeeLimit` fails with a message to upgrade.
- The admin console isn't open to any salon role. Platform admins are a separate `PlatformAdmin` model with their own sign-in.

### Email

Team invites, salon invites and password resets go out through [Resend](https://resend.com). The templates are React Email components in `apps/api/src/emails/`.

- Set `RESEND_API_KEY` in `apps/web/.dev.vars` to send for real. Without it, nothing is sent and the link is logged to the console.
- `EMAIL_FROM` must be on a domain verified in Resend. The default, `onboarding@resend.dev`, only delivers to the Resend account's own address.
- A failed send never fails the request: the app shows the link to copy instead of "Sent to …".

### Running on Cloudflare

The whole app is one Worker. Each request opens its own Prisma client through Hyperdrive (`withPrisma` in `packages/db`), because a Worker can't reuse a database connection between requests. Receipt photos are stored in R2 under `<companyId>/<uuid>.<ext>` and served through `/receipts/[id]` after an auth check.

## Deploy and CI

`.github/workflows/ci.yml` runs `typecheck` and `build` on every pull request and push. A push to `master` (or **Run workflow** on `master`, for a manual redeploy) then applies the Prisma migrations to the Railway database and runs `npm run deploy`, one deploy at a time. The `production` environment needs three secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` and `DATABASE_URL` (Railway's public Postgres URL, used only for migrations).

The first deploy (Railway database, Hyperdrive, R2 bucket, Worker secrets, Resend domain) is a manual runbook in `docs/deploy.md`. The Worker is over the 3 MiB limit of Cloudflare's free plan, so the account needs Workers Paid.

## Contributing

**Adding a screen**

1. Add a Zod schema in `packages/shared/src/index.ts`.
2. Add a route file in `apps/api/src/routes/` and mount it in `apps/api/src/app.ts` with a chained `.route()`, so the typed client sees it.
3. Add `page.tsx`, `actions.ts` and client components in `apps/web/src/app/(app)/<screen>/`, using the primitives in `apps/web/src/components/ui` and `PageHeader`/`PageBody` from `components/shell/page.tsx`.

**Changing the schema**: the source of truth for the data model is the "Luxe Hair Salon Manager — Database Schema" Claude Doc; keep `packages/db/prisma/schema.prisma` in line with it. Edit the schema, then run `npm run db:migrate`. If Prisma refuses because the change could lose data, `CLAUDE.md` has the manual migration steps.

**UI changes**: follow `docs/design-spec.md` for the salon app and `docs/admin-spec.md` for the admin console. Both list where the app deliberately differs from the design.

Run `npm run typecheck` before you push; CI runs it too.

## Licence

Proprietary. Copyright (c) 2026 Tonyblaise, all rights reserved. The code is public to read, but you may not use, copy, modify or host it without written permission. See [`LICENSE`](LICENSE).
