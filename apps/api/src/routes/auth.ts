import { prisma } from "@luxe-hair/db";
import {
  acceptInviteSchema,
  accountUpdateSchema,
  addDays,
  changePasswordSchema,
  emailOnlySchema,
  loginSchema,
  SIGNUP_OPEN,
  salonResetPasswordSchema,
  signupSchema,
  todayDate,
} from "@luxe-hair/shared";
import bcrypt from "bcryptjs";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { emailBrand, resetEmail, sendLater } from "../lib/email";
import { issueResetToken, issueToken, issuedBefore, nextSecond, verifyToken, waitUntil, type TokenPurpose } from "../lib/jwt";
import { getSettings } from "../lib/settings";
import { DUMMY_HASH } from "../lib/password";
import { validate } from "../lib/validate";
import { requireAuth, suspended } from "../middleware/auth";
import type { AppEnv } from "../types";


const badLink = (purpose: TokenPurpose) =>
  new HTTPException(400, {
    message: purpose === "invite" ? "This invite link is invalid or has expired." : "This reset link is invalid or has expired.",
  });

/** Resolves a single-use invite or password-reset link to its user. */
async function resolveLink(token: string, purpose: "invite" | "reset") {
  let claims;
  try {
    claims = await verifyToken(token);
  } catch {
    throw badLink(purpose);
  }
  if (claims.purpose !== purpose) throw badLink(purpose);
  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    include: { teamMember: true, company: true },
  });
  if (!user || user.deletedAt || !user.teamMember) throw badLink(purpose);
  if (purpose === "invite" && user.teamMember.status !== "invited") throw badLink(purpose);
  if (purpose === "reset" && user.teamMember.status !== "active") throw badLink(purpose);
  if (issuedBefore(claims, user.tokensValidAfter)) throw badLink(purpose);
  if (user.company.status === "suspended") throw suspended();
  return user;
}

export const authRoutes = new Hono<AppEnv>()
  .post("/signup", validate("json", signupSchema), async (c) => {
    if (!SIGNUP_OPEN) throw new HTTPException(403, { message: "Sign-up is closed. Ask us for an invite." });
    const input = c.req.valid("json");
    if (await prisma.user.findUnique({ where: { email: input.email } })) {
      throw new HTTPException(409, { message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    // Self-serve salons start like invited ones: the entry plan on a free trial.
    const [settings, entryPlan] = await Promise.all([getSettings(), prisma.plan.findFirst({ orderBy: { sortOrder: "asc" } })]);
    const user = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: input.companyName,
          status: "trial",
          planId: entryPlan?.id ?? null,
          trialEndsAt: addDays(todayDate(), settings.trialDays),
        },
      });
      const created = await tx.user.create({
        data: {
          companyId: company.id,
          email: input.email,
          encryptedPassword: passwordHash,
          lastSignInAt: new Date(),
        },
      });
      await tx.company.update({ where: { id: company.id }, data: { adminId: created.id } });
      await tx.teamMember.create({
        data: {
          companyId: company.id,
          userId: created.id,
          firstName: input.firstName,
          lastName: input.lastName,
          role: "owner",
          status: "active",
          lastActive: new Date(),
        },
      });
      return created;
    });

    return c.json({ token: await issueToken(user) }, 201);
  })

  .post("/login", validate("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");
    const user = await prisma.user.findUnique({ where: { email }, include: { company: { select: { status: true } } } });
    const ok = await bcrypt.compare(password, user?.encryptedPassword ?? DUMMY_HASH);

    if (!user || !ok || user.deletedAt) {
      throw new HTTPException(401, { message: "Invalid email or password" });
    }
    if (user.bannedUntil && user.bannedUntil > new Date()) {
      throw new HTTPException(403, { message: "This account is suspended" });
    }
    if (user.company.status === "suspended") throw suspended();

    const now = new Date();
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { lastSignInAt: now } }),
      prisma.teamMember.updateMany({ where: { userId: user.id }, data: { lastActive: now } }),
    ]);
    return c.json({ token: await issueToken(user) });
  })

  .get("/invite", validate("query", z.object({ token: z.string().min(10).max(2000) })), async (c) => {
    const user = await resolveLink(c.req.valid("query").token, "invite");
    return c.json({
      firstName: user.teamMember!.firstName,
      email: user.email,
      company: user.company.name,
      role: user.teamMember!.role,
    });
  })

  .post("/accept-invite", validate("json", acceptInviteSchema), async (c) => {
    const { token, password } = c.req.valid("json");
    const user = await resolveLink(token, "invite");
    const now = new Date();
    const settings = await getSettings();
    const updated = await prisma.$transaction(async (tx) => {
      await tx.teamMember.update({ where: { userId: user.id }, data: { status: "active", lastActive: now } });
      // A salon invited from the admin console starts its free trial when the owner joins.
      if (user.company.status === "invited") {
        await tx.company.update({
          where: { id: user.companyId },
          data: { status: "trial", trialEndsAt: addDays(todayDate(), settings.trialDays) },
        });
      }
      return tx.user.update({
        where: { id: user.id },
        data: {
          encryptedPassword: await bcrypt.hash(password, 10),
          emailConfirmedAt: now,
          lastSignInAt: now,
          // Retires this invite link and any other copies of it.
          tokensValidAfter: nextSecond(),
        },
      });
    });
    // The sign-in token must be issued at or after tokensValidAfter.
    await waitUntil(updated.tokensValidAfter);
    return c.json({ token: await issueToken(updated) });
  })

  .post("/forgot", validate("json", emailOnlySchema), async (c) => {
    const [user, settings] = await Promise.all([
      prisma.user.findUnique({
        where: { email: c.req.valid("json").email },
        include: { teamMember: true, company: { select: { name: true, status: true } } },
      }),
      getSettings(),
    ]);
    // Only people who could sign in get a link (the same checks as resolveLink's "reset").
    const canReset =
      user &&
      !user.deletedAt &&
      !(user.bannedUntil && user.bannedUntil > new Date()) &&
      user.teamMember?.status === "active" &&
      user.company.status !== "suspended";
    if (canReset) {
      const email = resetEmail(emailBrand(settings), user.email, await issueResetToken(user), {
        firstName: user.teamMember!.firstName,
        company: user.company.name,
      });
      // After the response, so its timing can't reveal whether the account exists.
      sendLater(c, email);
    }
    // Same answer either way, so the form can't be used to discover who has an account.
    return c.json({ ok: true });
  })

  .get("/reset", validate("query", z.object({ token: z.string().min(10).max(2000) })), async (c) => {
    const user = await resolveLink(c.req.valid("query").token, "reset");
    return c.json({ firstName: user.teamMember!.firstName, email: user.email, company: user.company.name });
  })

  .post("/reset-password", validate("json", salonResetPasswordSchema), async (c) => {
    const { token, password } = c.req.valid("json");
    const user = await resolveLink(token, "reset");
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        encryptedPassword: await bcrypt.hash(password, 10),
        lastSignInAt: new Date(),
        // Retires the link and signs out every existing session.
        tokensValidAfter: nextSecond(),
      },
    });
    await waitUntil(updated.tokensValidAfter);
    return c.json({ token: await issueToken(updated) });
  })

  .get("/me", requireAuth, async (c) => {
    const user = c.get("user");
    const [company, teamMember] = await Promise.all([
      prisma.company.findUniqueOrThrow({ where: { id: user.companyId } }),
      prisma.teamMember.findUnique({ where: { userId: user.id } }),
    ]);
    return c.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: teamMember?.firstName ?? null,
      lastName: teamMember?.lastName ?? null,
      teamRole: teamMember?.role ?? null,
      company: { id: company.id, name: company.name, currency: company.currency },
    });
  })

  .patch("/me", requireAuth, validate("json", accountUpdateSchema), async (c) => {
    const user = c.get("user");
    const input = c.req.valid("json");
    if (input.email !== user.email && (await prisma.user.findUnique({ where: { email: input.email } }))) {
      throw new HTTPException(409, { message: "This email already has an account." });
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { email: input.email, phone: input.phone ?? null } }),
      prisma.teamMember.updateMany({
        where: { userId: user.id },
        data: { firstName: input.firstName, lastName: input.lastName },
      }),
    ]);
    return c.json({ ok: true });
  })

  .post("/change-password", requireAuth, validate("json", changePasswordSchema), async (c) => {
    const user = c.get("user");
    const { currentPassword, newPassword } = c.req.valid("json");
    if (!(await bcrypt.compare(currentPassword, user.encryptedPassword ?? DUMMY_HASH))) {
      throw new HTTPException(400, { message: "Your current password is incorrect." });
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { encryptedPassword: await bcrypt.hash(newPassword, 10), tokensValidAfter: nextSecond() },
    });
    // Other devices are signed out; this one gets a fresh token valid from the new boundary.
    await waitUntil(updated.tokensValidAfter);
    return c.json({ token: await issueToken(updated) });
  })

  .post("/logout-all", requireAuth, async (c) => {
    await prisma.user.update({
      where: { id: c.get("user").id },
      data: { tokensValidAfter: nextSecond() },
    });
    return c.json({ ok: true });
  });
