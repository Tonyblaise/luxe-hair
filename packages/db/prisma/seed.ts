import "dotenv/config";
import {
  addDays,
  addMonths,
  commissionFor,
  monthStart,
  todayDate,
  weekStart,
  WEEKDAYS,
} from "@luxe-hair/shared";
import bcrypt from "bcryptjs";
import { deleteCompanyData, prisma, type Prisma } from "../src/index";

const OWNER_EMAIL = "owner@luxehair.test";
const HISTORY_MONTHS = 11;

// Deterministic PRNG so every reseed produces the same history.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261014);
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!;
const between = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));
const roundTo = (n: number, step: number) => Math.round(n / step) * step;

const SERVICES = [
  { name: "Cut & Style", price: 9750, commissionType: "percent", commission: 45 },
  { name: "Men's Cut", price: 5200, commissionType: "percent", commission: 45 },
  { name: "Beard Trim", price: 3250, commissionType: "percent", commission: 50 },
  { name: "Single-Process Color", price: 15600, commissionType: "percent", commission: 40 },
  { name: "Balayage", price: 28600, commissionType: "percent", commission: 40 },
  { name: "Blowout", price: 7150, commissionType: "percent", commission: 50 },
  { name: "Gel Manicure", price: 6500, commissionType: "percent", commission: 50 },
  { name: "Spa Pedicure", price: 8450, commissionType: "percent", commission: 50 },
  { name: "Signature Facial", price: 14300, commissionType: "percent", commission: 35 },
  { name: "Brow Shape", price: 3900, commissionType: "flat", commission: 1500 },
] as const;

const EMPLOYEES = [
  { firstName: "Ava", lastName: "Reyes", employmentType: "full_time", phone: "0712 201 441", days: ["Tue", "Wed", "Thu", "Fri", "Sat"], services: ["Cut & Style", "Blowout", "Balayage", "Single-Process Color"] },
  { firstName: "Marcus", lastName: "Lee", employmentType: "full_time", phone: "0712 337 902", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], services: ["Men's Cut", "Beard Trim"] },
  { firstName: "Priya", lastName: "Shah", employmentType: "full_time", phone: "0722 118 560", days: ["Wed", "Thu", "Fri", "Sat", "Sun"], services: ["Single-Process Color", "Balayage", "Blowout"] },
  { firstName: "Jade", lastName: "Kim", employmentType: "contractor", phone: "0733 904 217", days: ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], services: ["Gel Manicure", "Spa Pedicure"] },
  { firstName: "Sofia", lastName: "Russo", employmentType: "full_time", phone: "0701 556 823", days: ["Mon", "Wed", "Thu", "Fri", "Sat"], services: ["Signature Facial", "Brow Shape"] },
  { firstName: "Noah", lastName: "Bennett", employmentType: "full_time", phone: "0745 662 019", days: ["Mon", "Tue", "Thu", "Fri", "Sat"], services: ["Cut & Style", "Men's Cut", "Blowout"] },
  { firstName: "Lena", lastName: "Park", employmentType: "contractor", phone: "0757 230 884", days: ["Fri", "Sat", "Sun"], services: ["Cut & Style", "Blowout"] },
  { firstName: "Omar", lastName: "Haddad", employmentType: "contractor", phone: "0768 412 337", days: ["Sat", "Sun"], services: ["Men's Cut", "Beard Trim"], inactive: true },
] as const;

const CLIENTS = [
  "Maya Torres", "Chloe Adams", "Daniel Okafor", "Sofia Lindqvist", "Grace Wambui", "Brian Kiptoo",
  "Amara Njeri", "Kevin Mutua", "Faith Achieng", "Leila Hassan", "Tom Ochieng", "Zawadi Mwende",
  "Rachel Kamau", "James Otieno", "Nadia Ali", "Esther Wanjiku", "Ian Mwangi", "Mercy Atieno",
  "Olivia Brooks", "Hannah Cole",
];

const PRODUCTS = [
  { name: "Hydrating Shampoo 300ml", brand: "Aveline", type: "retail", unitCost: 1300, price: 2900, quantityInStock: 14, reorderPoint: 6 },
  { name: "Repair Conditioner", brand: "Aveline", type: "retail", unitCost: 1400, price: 3100, quantityInStock: 4, reorderPoint: 6 },
  { name: "Sea Salt Texture Spray", brand: "Nordform", type: "retail", unitCost: 1100, price: 2600, quantityInStock: 9, reorderPoint: 4 },
  { name: "Matte Pomade", brand: "Nordform", type: "retail", unitCost: 900, price: 2300, quantityInStock: 3, reorderPoint: 5 },
  { name: "Bond Repair Treatment", brand: "Kerra Lab", type: "retail", unitCost: 2400, price: 5200, quantityInStock: 7, reorderPoint: 3 },
  { name: "Cuticle Oil", brand: "Gloss & Co", type: "retail", unitCost: 400, price: 1100, quantityInStock: 12, reorderPoint: 5 },
  { name: "Permanent Color Tubes", brand: null, type: "backbar", unitCost: 650, price: null, quantityInStock: 22, reorderPoint: 30 },
  { name: "Developer 20 Vol", brand: null, type: "backbar", unitCost: 1200, price: null, quantityInStock: 8, reorderPoint: 4 },
  { name: "Gel Base Coat", brand: null, type: "backbar", unitCost: 900, price: null, quantityInStock: 6, reorderPoint: 3 },
  { name: "Foil Sheets", brand: "Salon Pro", type: "backbar", unitCost: 1500, price: null, quantityInStock: 2, reorderPoint: 3 },
] as const;

const RECURRING = [
  { name: "Harbor Property Group · rent", amount: 180000, category: "rent_utilities" },
  { name: "City Power & Water", amount: 22000, category: "rent_utilities" },
  { name: "Booking software", amount: 6500, category: "equipment" },
] as const;

// Busier around December and school holidays.
const SEASON = [0.95, 0.9, 1.0, 1.0, 1.05, 1.0, 1.0, 1.05, 1.0, 1.05, 1.1, 1.25];

async function main() {
  const password = process.env.SEED_OWNER_PASSWORD;
  if (!password) throw new Error("Set SEED_OWNER_PASSWORD in packages/db/.env");
  const passwordHash = await bcrypt.hash(password, 10);
  const today = todayDate();

  await seedPlatform(passwordHash);

  const existing = await prisma.user.findUnique({ where: { email: OWNER_EMAIL } });
  if (existing) {
    await prisma.$transaction((tx) => deleteCompanyData(tx, existing.companyId), { timeout: 60_000 });
    console.log("Removed the previous Luxe Hair data.");
  }

  await prisma.$transaction(
    async (tx) => {
      const pro = await tx.plan.findUniqueOrThrow({ where: { name: "Pro" } });
      const company = await tx.company.create({
        data: { name: "Luxe Hair", city: "Nairobi", status: "active", planId: pro.id },
      });
      const companyId = company.id;

      // ---------------------------------------------------------- team (app users)
      const team = [
        { email: OWNER_EMAIL, firstName: "Lauren", lastName: "Hayes", role: "owner", lastActive: new Date() },
        { email: "daniel@luxehair.test", firstName: "Daniel", lastName: "Mwangi", role: "manager", lastActive: new Date(Date.now() - 3 * 3600_000) },
        { email: "mia@luxehair.test", firstName: "Mia", lastName: "Chen", role: "front_desk", lastActive: new Date(Date.now() - 26 * 3600_000) },
        { email: "ruth@luxehair.test", firstName: "Ruth", lastName: "Achieng", role: "accountant", lastActive: new Date(Date.now() - 5 * 86400_000) },
        { email: "kevin@luxehair.test", firstName: "Kevin", lastName: "Otieno", role: "front_desk", invited: true },
      ] as const;
      for (const m of team) {
        const invited = "invited" in m;
        const user = await tx.user.create({
          data: {
            companyId,
            email: m.email,
            encryptedPassword: invited ? null : passwordHash,
            emailConfirmedAt: invited ? null : new Date(),
            lastSignInAt: invited ? null : m.lastActive,
          },
        });
        if (m.role === "owner") await tx.company.update({ where: { id: companyId }, data: { adminId: user.id } });
        await tx.teamMember.create({
          data: {
            companyId,
            userId: user.id,
            firstName: m.firstName,
            lastName: m.lastName,
            role: m.role,
            status: invited ? "invited" : "active",
            lastActive: invited ? null : m.lastActive,
            invitedDate: invited ? addDays(today, -3) : null,
          },
        });
      }

      // ---------------------------------------------------------- services, staff, clients
      const services = await Promise.all(
        SERVICES.map((s) => tx.service.create({ data: { ...s, companyId } })),
      );
      const serviceByName = new Map(services.map((s) => [s.name, s]));

      const employees = await Promise.all(
        EMPLOYEES.map((e) =>
          tx.employee.create({
            data: {
              companyId,
              firstName: e.firstName,
              lastName: e.lastName,
              employmentType: e.employmentType,
              phone: e.phone,
              scheduleDays: [...e.days],
              status: "inactive" in e ? "inactive" : "active",
            },
          }),
        ),
      );
      const staff = EMPLOYEES.map((e, i) => ({
        ...e,
        id: employees[i]!.id,
        serviceList: e.services.map((n) => serviceByName.get(n)!),
      }));
      await tx.employeeService.createMany({
        data: staff.flatMap((e) => e.serviceList.map((s) => ({ companyId, employeeId: e.id, serviceId: s.id }))),
      });

      await tx.client.createMany({
        data: CLIENTS.map((full) => {
          const [firstName, ...rest] = full.split(" ");
          return { companyId, firstName: firstName!, lastName: rest.join(" ") };
        }),
      });
      const clients = await tx.client.findMany({ where: { companyId } });

      // ---------------------------------------------------------- sales history (yesterday back ~11 months)
      const active = staff.filter((e) => !("inactive" in e));
      const sales: Prisma.SaleCreateManyInput[] = [];
      const historyStart = addMonths(monthStart(today), -HISTORY_MONTHS);
      for (let day = historyStart; day < today; day = addDays(day, 1)) {
        const weekday = WEEKDAYS[(day.getUTCDay() + 6) % 7]!;
        const factor = SEASON[day.getUTCMonth()]!;
        for (const e of staff) {
          const worksToday = (e.days as readonly string[]).includes(weekday);
          // Omar left four months ago.
          const stillHere = !("inactive" in e) || day < addMonths(monthStart(today), -4);
          if (!worksToday || !stillHere) continue;
          const count = Math.round(between(1, 3) * factor);
          for (let i = 0; i < count; i++) {
            const service = pick(e.serviceList);
            sales.push({
              companyId,
              date: day,
              serviceId: service.id,
              employeeId: e.id,
              clientId: rand() < 0.75 ? pick(clients).id : null,
              paymentMethod: rand() < 0.45 ? "mpesa" : rand() < 0.75 ? "card" : "cash",
              amount: service.price,
              tipAmount: rand() < 0.3 ? roundTo(between(200, 1200), 50) : 0,
            });
          }
        }
      }

      // ---------------------------------------------------------- today's appointments
      const times = ["09:00", "09:30", "10:15", "10:45", "11:15", "11:45", "12:30", "13:00", "13:45", "14:15", "15:00", "15:30"];
      const statuses = ["completed", "completed", "completed", "completed", "checked_in", "checked_in", "booked", "booked", "booked", "booked", "booked", "booked"] as const;
      const todayWeekday = WEEKDAYS[(today.getUTCDay() + 6) % 7]!;
      const onShift = active.filter((e) => (e.days as readonly string[]).includes(todayWeekday));
      const shift = onShift.length ? onShift : active;
      const fixedClients = ["Maya Torres", "Chloe Adams", "Grace Wambui", "Daniel Okafor"];
      for (const [i, time] of times.entries()) {
        const e = shift[i % shift.length]!;
        const service = i === 0 && e.serviceList.some((s) => s.name === "Balayage")
          ? serviceByName.get("Balayage")!
          : pick(e.serviceList);
        const clientName = fixedClients[i] ?? pick(CLIENTS);
        const client = clients.find((c) => `${c.firstName} ${c.lastName}` === clientName)!;
        await tx.appointment.create({
          data: { companyId, date: today, time, clientId: client.id, serviceId: service.id, employeeId: e.id, status: statuses[i]! },
        });
        if (statuses[i] === "completed") {
          sales.push({
            companyId, date: today, serviceId: service.id, employeeId: e.id, clientId: client.id,
            paymentMethod: pick(["card", "mpesa", "cash"] as const), amount: service.price,
            tipAmount: rand() < 0.4 ? 500 : 0,
          });
        }
      }
      await tx.sale.createMany({ data: sales });

      // ---------------------------------------------------------- paid commission payouts for finished weeks
      const serviceById = new Map(services.map((s) => [s.id, s]));
      const payouts = new Map<string, { employeeId: string; weekStart: Date; serviceSales: number; serviceCommission: number; tips: number }>();
      const thisWeek = weekStart(today);
      for (const s of sales) {
        const ws = weekStart(s.date as Date);
        if (ws >= thisWeek) continue;
        const key = `${s.employeeId}|${ws.toISOString()}`;
        const p = payouts.get(key) ?? { employeeId: s.employeeId, weekStart: ws, serviceSales: 0, serviceCommission: 0, tips: 0 };
        p.serviceSales += s.amount;
        p.serviceCommission += commissionFor(serviceById.get(s.serviceId)!, s.amount);
        p.tips += s.tipAmount ?? 0;
        payouts.set(key, p);
      }
      const nameOf = new Map(staff.map((e) => [e.id, `${e.firstName} ${e.lastName}`]));
      const expenses: Prisma.ExpenseCreateManyInput[] = [];
      await tx.payout.createMany({
        data: [...payouts.values()].map((p) => {
          const total = p.serviceCommission + p.tips;
          expenses.push({
            companyId, date: addDays(p.weekStart, 6), category: "payroll",
            description: `Commission payout · ${nameOf.get(p.employeeId)}`, amount: total,
          });
          return {
            companyId, employeeId: p.employeeId, weekStart: p.weekStart, weekEnd: addDays(p.weekStart, 6),
            serviceSales: p.serviceSales, serviceCommission: p.serviceCommission, retailCommission: 0,
            tips: p.tips, totalPayout: total, status: "paid", payDay: "Sunday",
          };
        }),
      });

      // ---------------------------------------------------------- expenses
      const recurring = await Promise.all(
        RECURRING.map((r) => tx.recurringExpense.create({ data: { ...r, companyId, autoPostDay: 1 } })),
      );
      for (let m = historyStart; m <= monthStart(today); m = addMonths(m, 1)) {
        for (const r of recurring) {
          expenses.push({
            companyId, date: m, category: r.category, description: r.name, amount: r.amount,
            isRecurring: true, recurringExpenseId: r.id,
          });
        }
        expenses.push({ companyId, date: addDays(m, 4), category: "marketing", description: "Instagram Ads", amount: roundTo(between(12000, 20000), 500), hasReceipt: false });
        expenses.push({ companyId, date: addDays(m, 11), category: "products_supplies", description: "Gloss & Co · nail supplies", amount: roundTo(between(12000, 22000), 500) });
        expenses.push({ companyId, date: addDays(m, 2), category: "products_supplies", description: "Kerra Lab · color order", amount: roundTo(between(30000, 60000), 500) });
        if (rand() < 0.5) expenses.push({ companyId, date: addDays(m, 15), category: "marketing", description: "Local Print Shop · flyers", amount: roundTo(between(4000, 9000), 500) });
      }
      for (let w = weekStart(historyStart); w < today; w = addDays(w, 7)) {
        if (w < historyStart) continue;
        expenses.push({ companyId, date: addDays(w, 4), category: "payroll", description: "Weekly front desk wages", amount: 25000 });
      }
      expenses.push({ companyId, date: addDays(today, -2), category: "equipment", description: "ProDry · 2 dryer chairs", amount: 96000 });
      await tx.expense.createMany({ data: expenses.filter((e) => (e.date as Date) <= today) });

      // ---------------------------------------------------------- tasks + inventory
      const nextSunday = addDays(thisWeek, 6);
      await tx.task.createMany({
        data: [
          { title: "Clean and restock color bar", type: "task", assignedTo: "Front desk", dueDate: addDays(today, -1), repeat: "weekly" },
          { title: "Reorder Repair Conditioner and Matte Pomade", type: "task", assignedTo: "Owner", dueDate: today },
          { title: "Text tomorrow's clients to confirm", type: "reminder", assignedTo: "Front desk", dueDate: today, dueTime: "16:00", repeat: "daily" },
          { title: "Call Chloe Adams about her color correction", type: "task", assignedTo: "Priya Shah", dueDate: today },
          { title: "Schedule ProDry install", type: "task", assignedTo: "Owner", dueDate: addDays(today, 2) },
          { title: "Run weekly commission payouts", type: "reminder", assignedTo: "Owner", dueDate: nextSunday, dueTime: "10:00", repeat: "weekly" },
          { title: "Pay rent", type: "task", assignedTo: "Owner", dueDate: addMonths(monthStart(today), 1), repeat: "monthly" },
          { title: "Upload last month's receipts", type: "task", assignedTo: "Owner", dueDate: addDays(today, -3), status: "done" },
        ].map((t) => ({ ...t, companyId }) as Prisma.TaskCreateManyInput),
      });
      await tx.inventoryProduct.createMany({ data: PRODUCTS.map((p) => ({ ...p, companyId })) });

      console.log(`Seeded Luxe Hair: ${sales.length} sales, ${expenses.length} expenses, ${payouts.size} paid payouts.`);
    },
    { timeout: 120_000 },
  );

  console.log(`Owner: ${OWNER_EMAIL} (password from SEED_OWNER_PASSWORD). Other team logins use the same password.`);
}

// ---------------------------------------------------------------- platform console

const PLANS = [
  { name: "Starter", price: 1500, employeeLimit: 6, sortOrder: 0 },
  { name: "Growth", price: 3500, employeeLimit: 12, sortOrder: 1 },
  { name: "Pro", price: 6500, employeeLimit: null, sortOrder: 2 },
] as const;

const SAMPLE_DOMAIN = "@sample.test";
const SAMPLES = [
  { name: "Halo Beauty Lounge", city: "Nairobi", owner: "Wanjiku Kamau", plan: "Growth", status: "active", staff: 6, seenHoursAgo: 2 },
  { name: "Kinky Roots Studio", city: "Mombasa", owner: "Achieng Odhiambo", plan: "Starter", status: "active", staff: 4, seenHoursAgo: 27 },
  { name: "The Barber Room", city: "Kisumu", owner: "Brian Otieno", plan: "Starter", status: "active", staff: 3, seenHoursAgo: 5 * 24 },
  { name: "Glow & Go Spa", city: "Nakuru", owner: "Faith Njeri", plan: "Growth", status: "trial", staff: 5, trialDaysLeft: 9, seenHoursAgo: 1 },
  { name: "Mane Street", city: "Eldoret", owner: "Kevin Kiprop", plan: "Starter", status: "trial", staff: 2, trialDaysLeft: 3, seenHoursAgo: 30 },
  { name: "Crown & Coil", city: "Nairobi", owner: "Zawadi Mwangi", plan: "Growth", status: "invited", staff: 0, invitedDaysAgo: 3 },
  { name: "Silk Nails Bar", city: "Thika", owner: "Mercy Wambui", plan: "Starter", status: "invited", staff: 0, invitedDaysAgo: 13 },
  { name: "Urban Fade", city: "Nairobi", owner: "James Mutua", plan: "Starter", status: "suspended", staff: 4, seenHoursAgo: 20 * 24, note: "Payment overdue" },
] as const;

async function seedPlatform(passwordHash: string) {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) throw new Error("Set SEED_ADMIN_PASSWORD in packages/db/.env");

  for (const p of PLANS) {
    await prisma.plan.upsert({ where: { name: p.name }, create: p, update: p });
  }
  await prisma.platformSettings.upsert({
    where: { id: 1 },
    create: { id: 1, supportEmail: "support@salonmanager.test", supportPhone: "+254 700 000 000" },
    update: {},
  });
  await prisma.platformAdmin.upsert({
    where: { email: "admin@salonmanager.test" },
    create: { name: "Amina Hassan", email: "admin@salonmanager.test", encryptedPassword: await bcrypt.hash(adminPassword, 10) },
    update: { encryptedPassword: await bcrypt.hash(adminPassword, 10) },
  });

  const plans = new Map((await prisma.plan.findMany()).map((p) => [p.name, p.id]));
  const old = await prisma.user.findMany({ where: { email: { endsWith: SAMPLE_DOMAIN } }, select: { companyId: true } });
  for (const companyId of new Set(old.map((u) => u.companyId))) {
    await prisma.$transaction((tx) => deleteCompanyData(tx, companyId));
  }

  const now = Date.now();
  const today = todayDate();
  for (const [i, c] of SAMPLES.entries()) {
    await prisma.$transaction(async (tx) => {
      const invited = c.status === "invited";
      const company = await tx.company.create({
        data: {
          name: c.name,
          city: c.city,
          status: c.status,
          planId: plans.get(c.plan),
          trialEndsAt: "trialDaysLeft" in c ? addDays(today, c.trialDaysLeft) : null,
          invitedAt: "invitedDaysAgo" in c ? new Date(now - c.invitedDaysAgo * 86_400_000) : null,
          suspendedAt: c.status === "suspended" ? new Date(now - 2 * 86_400_000) : null,
          statusNote: "note" in c ? c.note : null,
        },
      });
      const [firstName, ...rest] = c.owner.split(" ");
      const seen = "seenHoursAgo" in c ? new Date(now - c.seenHoursAgo * 3_600_000) : null;
      const owner = await tx.user.create({
        data: {
          companyId: company.id,
          email: `owner${i + 1}${SAMPLE_DOMAIN}`,
          encryptedPassword: invited ? null : passwordHash,
          lastSignInAt: seen,
        },
      });
      await tx.company.update({ where: { id: company.id }, data: { adminId: owner.id } });
      await tx.teamMember.create({
        data: {
          companyId: company.id,
          userId: owner.id,
          firstName: firstName!,
          lastName: rest.join(" "),
          role: "owner",
          status: invited ? "invited" : "active",
          lastActive: seen,
          invitedDate: "invitedDaysAgo" in c ? addDays(today, -c.invitedDaysAgo) : null,
        },
      });
      if (c.staff > 0) {
        await tx.employee.createMany({
          data: Array.from({ length: c.staff }, (_, n) => ({
            companyId: company.id,
            firstName: pick(["Amani", "Baraka", "Imani", "Neema", "Juma", "Halima", "Otieno", "Wairimu"]),
            lastName: `Staff ${n + 1}`,
            employmentType: "full_time" as const,
            scheduleDays: ["Tue", "Wed", "Thu", "Fri", "Sat"],
          })),
        });
      }
    });
  }
  console.log(`Platform: ${PLANS.length} plans, ${SAMPLES.length} sample salons, admin admin@salonmanager.test (password from SEED_ADMIN_PASSWORD).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
