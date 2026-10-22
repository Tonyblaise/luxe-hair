# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Luxe Hair is a multi-tenant salon manager: Hono API + Next.js 16 web app + Prisma 7 / Postgres, in an npm-workspaces + Turborepo monorepo (`apps/api`, `apps/web`, `packages/db`, `packages/shared`). Two sources of truth:
- Data model: the Claude Doc "Luxe Hair Salon Manager — Database Schema" (https://claude.ai/artifact/HLg2kkLzbJMevo2X1ZEw57); keep `packages/db/prisma/schema.prisma` in line with it.
- UI: `docs/design-spec.md`, extracted from the Claude Design file `Salon Manager.dc.html` (one responsive app; `Salon Manager Mobile.dc.html` shows it in 390px phone frames and is the reference for phone layouts). `docs/admin-spec.md` covers `Salon Admin.dc.html`, the platform admin console at `/admin`. Both list where the project deliberately differs from the design.

## Commands

Run from the repo root (Node 22):

```bash
npm run dev          # api :4000 + web :3000 (turbo runs prisma generate first)
npm run typecheck    # tsc --noEmit in every workspace
npm run build        # tsup for api, next build for web
npm run db:generate  # regenerate Prisma client after schema edits
npm run db:migrate   # prisma migrate dev (prompts for a migration name)
npm run db:seed      # plans, platform settings + admin, 8 sample salons, and Luxe Hair (~12 months of data); other salons untouched
npm run db:studio
```

One workspace: `npm run <script> -w @luxe-hair/api` (or `web`, `db`, `shared`). Prisma 7 refuses `migrate dev` non-interactively when a change could lose data; then generate SQL with `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`, put it in a new `prisma/migrations/<timestamp>_<name>/migration.sql` (hand-edit drops into renames), and apply with `npx prisma migrate deploy`.

There is no test runner or linter configured yet; `typecheck` is the gate.

Env files (git-ignored, copy from the `.env.example` beside each): `packages/db/.env` (`DATABASE_URL`, `SEED_OWNER_PASSWORD` — every seeded salon login uses it, `SEED_ADMIN_PASSWORD` — `admin@salonmanager.test`), `apps/api/.env` (`DATABASE_URL`, `JWT_SECRET`, `WEB_ORIGIN`, `PORT`, optional `UPLOAD_DIR`), `apps/web/.env.local` (`API_URL`). The api loads its env via `tsx/node --env-file=.env`, not dotenv. Locally, port 5432 is Postgres.app 17 (not the Homebrew postgresql@16 service), database `luxe_hair`. Receipt uploads land in `apps/api/uploads/<companyId>/` (git-ignored).

## Architecture

**Shared (`packages/shared`)** — Zod input schemas, enum value lists with display labels, and pure helpers used by seed, API and web: `dates.ts` (calendar dates are UTC-midnight `Date`s for Postgres `DATE`; "today" is `todayDate()` in Africa/Nairobi; pay weeks are Mon–Sun) and `money.ts` (`commissionFor`, `formatKES`). Consumed as TS source.

**Data (`packages/db`)** — Prisma 7: datasource URL and seed command live in `prisma.config.ts`, not the schema. The `prisma-client` generator writes to `src/generated/prisma` (git-ignored; regenerate after a fresh clone). `src/index.ts` exports a singleton `prisma` built on `@prisma/adapter-pg` over a `pg` Pool, plus all generated types.

Schema conventions: every tenant table has `companyId` (cascade on company delete); uuid ids; `createdDate`/`modifiedDate`; camelCase fields `@map`ped to snake_case; enums use lowercase snake_case values; money is `Int` in KES; calendar dates are `@db.Date`; appointment times are 24h `"HH:MM"` strings. Composite indexes lead with `companyId`; name uniqueness is per company. `Company.adminId` is nullable only so signup can create the company before its admin User in one transaction. Service commission is `commissionType` (`percent` | `flat`) + `commission`.

**Auth (stateless JWT)** — `apps/api/src/lib/jwt.ts` issues HS256 salon tokens (`sub`, `company_id`, `role`, `iat`, `exp` = 90 days) plus single-purpose tokens that `requireAuth` rejects: `invite`, `reset` (salon password reset, 1 h), `platform` (admin console session, 7 days) and `admin-reset`. `requireAuth` also returns 403 for users of a suspended company (web `unwrap` turns that into sign-out with a notice). `requireAuth` loads the User and rejects deleted, banned, password-less (invited) users and any token issued before `users.tokens_valid_after`. Anything that must kill existing tokens (logout-all, password change, removing a member, resending or accepting an invite) moves `tokens_valid_after` to `nextSecond()`, because `iat` has whole-second precision; when a fresh token is issued right after, the route waits until that boundary. `requireManager` gates team and payout mutations to owner/manager.

**Platform admin (`/platform` API, `/admin` web)** — a separate `PlatformAdmin` model (not a `User`) authenticated by `requirePlatformAdmin` (`middleware/platform.ts`); routes in `routes/platform.ts` attach that middleware per route because the public `/platform/auth/*` routes share the sub-app. Company lifecycle is `Company.status`: `invited` (admin invite) → `trial` (owner accepts, or self-serve signup; `trialEndsAt` from `PlatformSettings.trialDays`) → `active`; `suspended` blocks the salon and signs its users out; revoke only while invited, delete only while suspended (`deleteCompanyData` in `packages/db/src/company.ts`, plus receipts). `Plan.employeeLimit` is enforced when adding or reactivating employees. Platform tables (`Plan`, `PlatformSettings` single row id 1, `PlatformAdmin`) are not tenant-scoped. The web side uses its own httpOnly `lh_admin` cookie and `adminApi()`/`adminUnwrap` from `src/lib/admin.ts`; there's no email service, so invite and reset links are shown to copy (admin forgot-password links go to the API console in development).

**Tenant scoping** — `requireAuth` sets `c.var.companyId`; every query must take `companyId` from there, never from the request. Updates/deletes use `updateMany`/`deleteMany` (or `findFirst`) with `{ id, companyId }` and return 404 when nothing matches, so another salon's ids look nonexistent. Ids taken from a request body (e.g. a sale's service/employee, an employee's serviceIds) are checked against the company first.

**API (`apps/api`)** — routes are Hono sub-apps built with chained calls and mounted with chained `.route()` in `src/app.ts`, which exports `type AppType`. Breaking the chain loses the typed client in web. Mount sub-apps that call `.use(requireAuth)` under their own prefix, never at `/`, or the middleware applies to every route. Validate with `validate()` from `src/lib/validate.ts` (not raw `zValidator`): it throws a 400, keeping error bodies out of each route's typed response. `app.onError` turns `HTTPException` and Prisma P2002/P2003 into `{ error }` JSON. Payout figures come from `lib/payouts.ts` `computeWeek()` (dashboard, payouts, employees all use it). tsup bundles `@luxe-hair/*` but must keep `pg` and `@prisma/*` external (CommonJS, breaks in the ESM bundle).

**Web (`apps/web`)** — the JWT lives only in the httpOnly `lh_token` cookie; the browser never calls the API. Server components and server actions use `api()` from `src/lib/api.ts` (server-only `hc<AppType>` client with the Bearer header). Use `unwrapAll(reqA, reqB)` for parallel fetches, not `Promise.all([unwrap(await a), …])` — the latter leaves a 401 redirect rejection unhandled. `unwrap` throws `ApiError` on failure and redirects 401s to `/logout` (a route handler that clears the cookie). Receipts are proxied by `app/receipts/[id]/route.ts`. `src/proxy.ts` (Next 16 middleware) redirects by cookie presence (`lh_token` for the salon app, `lh_admin` under `/admin`); `/accept-invite`, `/reset-password` and `/admin/reset` are open to everyone.

UI: Tailwind 4 tokens from the design system live in `globals.css` `@theme` (custom breakpoints: `sm` 640 phone/tablet split, `wide` 900 sidebar layout, `xl` 1100 two-pane). Primitives are in `src/components/ui` (barrel `@/components/ui`); `inputBase` has no width so callers can size controls. The responsive shell is `components/shell` (sidebar ≥ 900, scrolling top bar 640–899, hamburger drawer < 640); each page renders `PageHeader` + `PageBody`. Modals open via `?modal=<id>` (`ModalLink`, `Modal`, bottom sheet below 640). Filters are URL params rendered as `PillLink`s.

**Adding or changing a screen** — Zod schema in `packages/shared/src/index.ts` → route in `apps/api/src/routes/` chained into `app.ts` → `apps/web/src/app/(app)/<screen>/` with `page.tsx` (server), `actions.ts` (server actions built on `mutate()`/`fail()` from `lib/action.ts`, which turns `ApiError` into a form error, revalidates, and returns a toast), and client components that call `useActionFeedback(state, onSuccess)` to show the toast. Sales and Services are compact references; Employees shows live-saving fields.
