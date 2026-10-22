import { prisma } from "@luxe-hair/db";
import { idParamSchema, inviteSchema, todayDate } from "@luxe-hair/shared";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { issueInviteToken, nextSecond, waitUntil } from "../lib/jwt";
import { validate } from "../lib/validate";
import { requireAuth, requireManager } from "../middleware/auth";
import type { AppEnv } from "../types";

const notFound = () => new HTTPException(404, { message: "Team member not found" });

async function findMember(companyId: string, id: string) {
  const member = await prisma.teamMember.findFirst({ where: { id, companyId }, include: { user: true } });
  if (!member || member.user.deletedAt) throw notFound();
  return member;
}

export const teamRoutes = new Hono<AppEnv>()
  .use(requireAuth)

  .get("/", async (c) => {
    const members = await prisma.teamMember.findMany({
      where: { companyId: c.get("companyId"), user: { deletedAt: null } },
      include: { user: { select: { email: true } } },
    });
    const rank = { owner: 0, manager: 1, front_desk: 2, accountant: 3 } as const;
    return c.json(
      members
        .sort((a, b) => rank[a.role] - rank[b.role] || a.firstName.localeCompare(b.firstName))
        .map((m) => ({
          id: m.id,
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.user.email,
          role: m.role,
          status: m.status,
          lastActive: m.lastActive?.toISOString() ?? null,
          invitedDate: m.invitedDate?.toISOString() ?? null,
          isSelf: m.userId === c.get("user").id,
        })),
    );
  })

  .post("/invite", requireManager, validate("json", inviteSchema), async (c) => {
    const companyId = c.get("companyId");
    const input = c.req.valid("json");
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    // A member removed from this salon can be invited back; any other match is taken.
    if (existing && !(existing.deletedAt && existing.companyId === companyId)) {
      throw new HTTPException(409, { message: "This email already has an account." });
    }

    const user = await prisma.$transaction(async (tx) => {
      const u = existing
        ? await tx.user.update({
            where: { id: existing.id },
            data: { deletedAt: null, encryptedPassword: null, emailConfirmedAt: null, tokensValidAfter: new Date() },
          })
        : await tx.user.create({ data: { companyId, email: input.email, tokensValidAfter: new Date() } });
      const member = { firstName: input.firstName, lastName: input.lastName, role: input.role, status: "invited" as const, invitedDate: todayDate(), lastActive: null };
      await tx.teamMember.upsert({
        where: { userId: u.id },
        create: { ...member, companyId, userId: u.id },
        update: member,
      });
      return u;
    });

    return c.json({ token: await issueInviteToken({ ...user, role: input.role }) }, 201);
  })

  .post("/:id/resend", requireManager, validate("param", idParamSchema), async (c) => {
    const member = await findMember(c.get("companyId"), c.req.valid("param").id);
    if (member.status !== "invited") throw new HTTPException(400, { message: "This person has already joined." });
    // Older links stop working once a new one is sent.
    const user = await prisma.user.update({ where: { id: member.userId }, data: { tokensValidAfter: nextSecond() } });
    await prisma.teamMember.update({ where: { id: member.id }, data: { invitedDate: todayDate() } });
    await waitUntil(user.tokensValidAfter);
    return c.json({ token: await issueInviteToken({ ...user, role: member.role }) });
  })

  .delete("/:id", requireManager, validate("param", idParamSchema), async (c) => {
    const member = await findMember(c.get("companyId"), c.req.valid("param").id);
    if (member.role === "owner") throw new HTTPException(400, { message: "The owner can't be removed." });
    if (member.userId === c.get("user").id) throw new HTTPException(400, { message: "You can't remove yourself." });

    if (member.status === "invited") {
      await prisma.$transaction([
        prisma.teamMember.delete({ where: { id: member.id } }),
        prisma.user.delete({ where: { id: member.userId } }),
      ]);
    } else {
      // Soft delete keeps their history; bumping the boundary signs them out everywhere.
      await prisma.user.update({
        where: { id: member.userId },
        data: { deletedAt: new Date(), tokensValidAfter: nextSecond() },
      });
    }
    return c.json({ ok: true });
  });
