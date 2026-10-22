import { deleteCompanyData, prisma } from "@luxe-hair/db";
import {
  adminPasswordSchema,
  adminProfileSchema,
  companyInviteSchema,
  companyPlanSchema,
  emailOnlySchema,
  idParamSchema,
  loginSchema,
  platformSettingsSchema,
  resetPasswordSchema,
  todayDate,
} from "@luxe-hair/shared";
import bcrypt from "bcryptjs";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { env } from "../env";
import {
  issueAdminResetToken,
  issueInviteToken,
  issuePlatformToken,
  issueResetToken,
  issuedBefore,
  nextSecond,
  verifyToken,
  waitUntil,
} from "../lib/jwt";
import { getSettings } from "../lib/settings";
import { removeCompanyUploads } from "../lib/uploads";
import { validate } from "../lib/validate";
import { requirePlatformAdmin, type PlatformEnv } from "../middleware/platform";

const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);
const DAY_MS = 86_400_000;

const notFound = () => new HTTPException(404, { message: "Company not found" });
const wrongStatus = (message: string) => new HTTPException(400, { message });

async function findCompany(id: string) {
  const company = await prisma.company.findUnique({
    where: { id },
    include: { admin: { include: { teamMember: true } } },
  });
  if (!company) throw notFound();
  return company;
}

const ownerName = (c: Awaited<ReturnType<typeof findCompany>>) =>
  c.admin?.teamMember ? `${c.admin.teamMember.firstName} ${c.admin.teamMember.lastName}`.trim() : "—";

const serializeAdmin = (a: { id: string; name: string; email: string; phone: string | null }) => ({
  id: a.id,
  name: a.name,
  email: a.email,
  phone: a.phone ?? "",
});

export const platformRoutes = new Hono<PlatformEnv>()
  // ------------------------------------------------------------ public
  .post("/auth/login", validate("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");
    const admin = await prisma.platformAdmin.findUnique({ where: { email } });
    const ok = await bcrypt.compare(password, admin?.encryptedPassword ?? DUMMY_HASH);
    if (!admin || !ok) throw new HTTPException(401, { message: "Incorrect email or password." });
    await prisma.platformAdmin.update({ where: { id: admin.id }, data: { lastSignInAt: new Date() } });
    return c.json({ token: await issuePlatformToken(admin.id), name: admin.name });
  })

  .post("/auth/forgot", validate("json", emailOnlySchema), async (c) => {
    const admin = await prisma.platformAdmin.findUnique({ where: { email: c.req.valid("json").email } });
    if (admin) {
      const link = `${env.webOrigin}/admin/reset?token=${await issueAdminResetToken(admin.id)}`;
      // No email service yet: the link only reaches the API console, and never in production.
      if (process.env.NODE_ENV !== "production") console.log(`[admin reset] ${admin.email}: ${link}`);
    }
    // Same answer either way, so the form can't be used to discover admin emails.
    return c.json({ ok: true });
  })

  .post("/auth/reset", validate("json", resetPasswordSchema), async (c) => {
    const { token, password } = c.req.valid("json");
    const invalid = () => new HTTPException(400, { message: "This reset link is invalid or has expired." });
    let claims;
    try {
      claims = await verifyToken(token);
    } catch {
      throw invalid();
    }
    if (claims.purpose !== "admin-reset") throw invalid();
    const admin = await prisma.platformAdmin.findUnique({ where: { id: claims.sub } });
    if (!admin || issuedBefore(claims, admin.tokensValidAfter)) throw invalid();
    const updated = await prisma.platformAdmin.update({
      where: { id: admin.id },
      data: { encryptedPassword: await bcrypt.hash(password, 10), tokensValidAfter: nextSecond(), lastSignInAt: new Date() },
    });
    await waitUntil(updated.tokensValidAfter);
    return c.json({ token: await issuePlatformToken(admin.id), name: admin.name });
  })

  // ------------------------------------------------------------ profile
  .get("/me", requirePlatformAdmin, (c) => c.json(serializeAdmin(c.get("admin"))))

  .patch("/me", requirePlatformAdmin, validate("json", adminProfileSchema), async (c) => {
    const admin = c.get("admin");
    const input = c.req.valid("json");
    if (input.email !== admin.email && (await prisma.platformAdmin.findUnique({ where: { email: input.email } }))) {
      throw new HTTPException(409, { message: "Another admin already uses this email." });
    }
    const updated = await prisma.platformAdmin.update({
      where: { id: admin.id },
      data: { name: input.name, email: input.email, phone: input.phone ?? null },
    });
    return c.json(serializeAdmin(updated));
  })

  .post("/me/password", requirePlatformAdmin, validate("json", adminPasswordSchema), async (c) => {
    const admin = c.get("admin");
    const { currentPassword, newPassword } = c.req.valid("json");
    if (!(await bcrypt.compare(currentPassword, admin.encryptedPassword))) {
      throw new HTTPException(400, { message: "Your current password is incorrect." });
    }
    const updated = await prisma.platformAdmin.update({
      where: { id: admin.id },
      data: { encryptedPassword: await bcrypt.hash(newPassword, 10), tokensValidAfter: nextSecond() },
    });
    await waitUntil(updated.tokensValidAfter);
    return c.json({ token: await issuePlatformToken(admin.id) });
  })

  // ------------------------------------------------------------ companies
  .get("/companies", requirePlatformAdmin, async (c) => {
    const [companies, staff, lastSeen, plans, settings] = await Promise.all([
      prisma.company.findMany({
        orderBy: { createdDate: "desc" },
        include: { plan: true, admin: { include: { teamMember: true } } },
      }),
      prisma.employee.groupBy({ by: ["companyId"], where: { status: "active" }, _count: true }),
      prisma.user.groupBy({ by: ["companyId"], where: { deletedAt: null }, _max: { lastSignInAt: true } }),
      prisma.plan.findMany({ orderBy: { sortOrder: "asc" } }),
      getSettings(),
    ]);
    const expiry = settings.inviteDays * DAY_MS;
    const rows = companies.map((co) => {
      const invitedAt = co.invitedAt?.getTime() ?? 0;
      return {
        id: co.id,
        name: co.name,
        city: co.city,
        status: co.status,
        planId: co.planId,
        owner: {
          name: co.admin?.teamMember ? `${co.admin.teamMember.firstName} ${co.admin.teamMember.lastName}`.trim() : "—",
          email: co.admin?.email ?? "",
        },
        staff: staff.find((s) => s.companyId === co.id)?._count ?? 0,
        lastSignInAt: lastSeen.find((l) => l.companyId === co.id)?._max.lastSignInAt?.toISOString() ?? null,
        trialEndsAt: co.trialEndsAt?.toISOString() ?? null,
        invitedAt: co.invitedAt?.toISOString() ?? null,
        inviteExpired: co.status === "invited" && invitedAt > 0 && Date.now() - invitedAt > expiry,
        suspendedAt: co.suspendedAt?.toISOString() ?? null,
        statusNote: co.statusNote,
      };
    });
    const count = (s: string) => rows.filter((r) => r.status === s).length;
    return c.json({
      today: todayDate().toISOString(),
      rows,
      kpis: {
        active: count("active"),
        trial: count("trial"),
        invited: count("invited"),
        invitesExpired: rows.filter((r) => r.inviteExpired).length,
        staff: rows.filter((r) => r.status === "active" || r.status === "trial").reduce((s, r) => s + r.staff, 0),
      },
      plans: plans.map((p) => ({ id: p.id, name: p.name, price: p.price, employeeLimit: p.employeeLimit })),
      settings: { trialDays: settings.trialDays, inviteDays: settings.inviteDays },
    });
  })

  .post("/companies", requirePlatformAdmin, validate("json", companyInviteSchema), async (c) => {
    const input = c.req.valid("json");
    if (await prisma.user.findUnique({ where: { email: input.ownerEmail } })) {
      throw new HTTPException(409, { message: "A company with this owner email already exists." });
    }
    if (!(await prisma.plan.findUnique({ where: { id: input.planId } }))) throw new HTTPException(400, { message: "Unknown plan" });
    const settings = await getSettings();
    const [firstName = "", ...rest] = input.ownerName.split(/\s+/);

    const owner = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: input.name, city: input.city ?? null, planId: input.planId, status: "invited", invitedAt: new Date() },
      });
      const user = await tx.user.create({ data: { companyId: company.id, email: input.ownerEmail, tokensValidAfter: new Date() } });
      await tx.company.update({ where: { id: company.id }, data: { adminId: user.id } });
      await tx.teamMember.create({
        data: {
          companyId: company.id,
          userId: user.id,
          firstName,
          lastName: rest.join(" "),
          role: "owner",
          status: "invited",
          invitedDate: todayDate(),
        },
      });
      return user;
    });
    return c.json({ token: await issueInviteToken({ ...owner, role: "owner" }, settings.inviteDays) }, 201);
  })

  .patch("/companies/:id", requirePlatformAdmin, validate("param", idParamSchema), validate("json", companyPlanSchema), async (c) => {
    const company = await findCompany(c.req.valid("param").id);
    const plan = await prisma.plan.findUnique({ where: { id: c.req.valid("json").planId } });
    if (!plan) throw new HTTPException(400, { message: "Unknown plan" });
    await prisma.company.update({ where: { id: company.id }, data: { planId: plan.id } });
    return c.json({ name: company.name, plan: plan.name });
  })

  .post("/companies/:id/resend", requirePlatformAdmin, validate("param", idParamSchema), async (c) => {
    const company = await findCompany(c.req.valid("param").id);
    if (company.status !== "invited" || !company.admin) throw wrongStatus("Only pending invites can be resent.");
    const settings = await getSettings();
    // Older links stop working once a new one is sent.
    const user = await prisma.user.update({ where: { id: company.admin.id }, data: { tokensValidAfter: nextSecond() } });
    await prisma.$transaction([
      prisma.company.update({ where: { id: company.id }, data: { invitedAt: new Date() } }),
      prisma.teamMember.update({ where: { userId: user.id }, data: { invitedDate: todayDate() } }),
    ]);
    await waitUntil(user.tokensValidAfter);
    return c.json({ token: await issueInviteToken({ ...user, role: "owner" }, settings.inviteDays), email: user.email });
  })

  .post("/companies/:id/revoke", requirePlatformAdmin, validate("param", idParamSchema), async (c) => {
    const company = await findCompany(c.req.valid("param").id);
    if (company.status !== "invited") throw wrongStatus("Only pending invites can be revoked.");
    await prisma.$transaction((tx) => deleteCompanyData(tx, company.id));
    return c.json({ name: company.name });
  })

  .post("/companies/:id/suspend", requirePlatformAdmin, validate("param", idParamSchema), async (c) => {
    const company = await findCompany(c.req.valid("param").id);
    if (company.status !== "active" && company.status !== "trial") throw wrongStatus("Only active or trial companies can be suspended.");
    await prisma.$transaction([
      prisma.company.update({ where: { id: company.id }, data: { status: "suspended", suspendedAt: new Date(), statusNote: null } }),
      // Everyone in the salon is signed out immediately.
      prisma.user.updateMany({ where: { companyId: company.id }, data: { tokensValidAfter: nextSecond() } }),
    ]);
    return c.json({ name: company.name });
  })

  .post("/companies/:id/reactivate", requirePlatformAdmin, validate("param", idParamSchema), async (c) => {
    const company = await findCompany(c.req.valid("param").id);
    if (company.status !== "suspended") throw wrongStatus("Only suspended companies can be reactivated.");
    await prisma.company.update({
      where: { id: company.id },
      data: { status: "active", suspendedAt: null, statusNote: null },
    });
    return c.json({ name: company.name });
  })

  .post("/companies/:id/reset-owner-password", requirePlatformAdmin, validate("param", idParamSchema), async (c) => {
    const company = await findCompany(c.req.valid("param").id);
    if (company.status !== "active" && company.status !== "trial") throw wrongStatus("The company must be active or on trial.");
    const owner = company.admin;
    if (!owner || owner.deletedAt || owner.teamMember?.status !== "active") throw wrongStatus("This company's owner hasn't joined yet.");
    return c.json({ token: await issueResetToken({ ...owner, role: "owner" }), email: owner.email, owner: ownerName(company) });
  })

  .delete("/companies/:id", requirePlatformAdmin, validate("param", idParamSchema), async (c) => {
    const company = await findCompany(c.req.valid("param").id);
    if (company.status !== "suspended") throw wrongStatus("Suspend the company before deleting it.");
    await prisma.$transaction((tx) => deleteCompanyData(tx, company.id), { timeout: 60_000 });
    await removeCompanyUploads(company.id);
    return c.json({ name: company.name });
  })

  // ------------------------------------------------------------ settings
  .get("/settings", requirePlatformAdmin, async (c) => {
    const [settings, plans] = await Promise.all([
      getSettings(),
      prisma.plan.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { companies: true } } } }),
    ]);
    const { id: _, modifiedDate: _m, ...fields } = settings;
    return c.json({
      ...fields,
      plans: plans.map((p) => ({ id: p.id, name: p.name, price: p.price, employeeLimit: p.employeeLimit, companies: p._count.companies })),
    });
  })

  .put("/settings", requirePlatformAdmin, validate("json", platformSettingsSchema), async (c) => {
    const { plans, ...fields } = c.req.valid("json");
    const known = await prisma.plan.count({ where: { id: { in: plans.map((p) => p.id) } } });
    if (known !== plans.length) throw new HTTPException(400, { message: "Unknown plan" });
    await prisma.$transaction([
      prisma.platformSettings.upsert({ where: { id: 1 }, create: { id: 1, ...fields }, update: fields }),
      ...plans.map((p) => prisma.plan.update({ where: { id: p.id }, data: { price: p.price, employeeLimit: p.employeeLimit } })),
    ]);
    return c.json({ ok: true });
  });

