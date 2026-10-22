import type { Prisma } from "./generated/prisma/client";

/** Deletes a company and every row that belongs to it, children first (most relations are RESTRICT). */
export async function deleteCompanyData(tx: Prisma.TransactionClient, companyId: string) {
  const where = { companyId };
  await tx.sale.deleteMany({ where });
  await tx.appointment.deleteMany({ where });
  await tx.payout.deleteMany({ where });
  await tx.expense.deleteMany({ where });
  await tx.recurringExpense.deleteMany({ where });
  await tx.employeeService.deleteMany({ where });
  await tx.task.deleteMany({ where });
  await tx.inventoryProduct.deleteMany({ where });
  await tx.client.deleteMany({ where });
  await tx.service.deleteMany({ where });
  await tx.employee.deleteMany({ where });
  await tx.teamMember.deleteMany({ where });
  await tx.company.update({ where: { id: companyId }, data: { adminId: null } });
  await tx.user.deleteMany({ where });
  await tx.company.delete({ where: { id: companyId } });
}
