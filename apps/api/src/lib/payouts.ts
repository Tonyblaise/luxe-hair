import { prisma } from "@luxe-hair/db";
import { addDays, commissionFor } from "@luxe-hair/shared";

export type PayoutLine = {
  serviceId: string;
  name: string;
  count: number;
  price: number;
  commissionType: "percent" | "flat";
  commission: number;
  earned: number;
};

export type PayoutRow = {
  employeeId: string;
  name: string;
  role: string;
  serviceSales: number;
  serviceCommission: number;
  retailSales: number;
  retailCommission: number;
  tips: number;
  total: number;
  status: "pending" | "paid";
  lines: PayoutLine[];
};

/** Commission owed per employee for the Mon–Sun week starting at `weekStart`, from that week's sales. */
export async function computeWeek(companyId: string, weekStart: Date): Promise<PayoutRow[]> {
  const weekEnd = addDays(weekStart, 6);
  const [sales, paid] = await Promise.all([
    prisma.sale.findMany({
      where: { companyId, date: { gte: weekStart, lte: weekEnd } },
      include: { service: true, employee: true },
    }),
    prisma.payout.findMany({ where: { companyId, weekStart, status: "paid" } }),
  ]);
  const paidIds = new Set(paid.map((p) => p.employeeId));

  const rows = new Map<string, PayoutRow>();
  for (const s of sales) {
    let row = rows.get(s.employeeId);
    if (!row) {
      row = {
        employeeId: s.employeeId,
        name: `${s.employee.firstName} ${s.employee.lastName}`,
        role: s.employee.role,
        serviceSales: 0,
        serviceCommission: 0,
        retailSales: 0,
        retailCommission: 0,
        tips: 0,
        total: 0,
        status: paidIds.has(s.employeeId) ? "paid" : "pending",
        lines: [],
      };
      rows.set(s.employeeId, row);
    }
    const earned = commissionFor(s.service, s.amount);
    row.serviceSales += s.amount;
    row.serviceCommission += earned;
    row.tips += s.tipAmount;
    row.total = row.serviceCommission + row.retailCommission + row.tips;

    let line = row.lines.find((l) => l.serviceId === s.serviceId);
    if (!line) {
      line = {
        serviceId: s.serviceId,
        name: s.service.name,
        count: 0,
        price: s.service.price,
        commissionType: s.service.commissionType,
        commission: s.service.commission,
        earned: 0,
      };
      row.lines.push(line);
    }
    line.count += 1;
    line.earned += earned;
  }

  // A payout already marked paid keeps its recorded figures.
  for (const p of paid) {
    const row = rows.get(p.employeeId);
    if (row) row.total = p.totalPayout;
  }

  return [...rows.values()]
    .map((r) => ({ ...r, lines: r.lines.sort((a, b) => b.earned - a.earned) }))
    .sort((a, b) => b.total - a.total);
}
