import { z } from "zod";

export * from "./dates";
export * from "./money";

// ---------------------------------------------------------------- enums + labels

export const TEAM_ROLES = ["owner", "manager", "front_desk", "accountant"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];
export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  owner: "Owner",
  manager: "Manager",
  front_desk: "Front Desk",
  accountant: "Accountant",
};
export const INVITABLE_ROLES = ["manager", "front_desk", "accountant"] as const;

export const PAYMENT_METHODS = ["card", "cash", "mpesa"] as const;
export const PAYMENT_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  card: "Card",
  cash: "Cash",
  mpesa: "M-Pesa",
};

export const EXPENSE_CATEGORIES = [
  "rent_utilities",
  "products_supplies",
  "payroll",
  "marketing",
  "equipment",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent_utilities: "Rent & Utilities",
  products_supplies: "Products & Supplies",
  payroll: "Payroll",
  marketing: "Marketing",
  equipment: "Equipment",
};

export const EMPLOYMENT_TYPES = ["full_time", "contractor"] as const;
export const EMPLOYMENT_LABELS: Record<(typeof EMPLOYMENT_TYPES)[number], string> = {
  full_time: "Full-time",
  contractor: "Contractor",
};
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const TASK_TYPES = ["task", "reminder"] as const;
export const TASK_REPEATS = ["none", "daily", "weekly", "monthly"] as const;
export const TASK_REPEAT_LABELS: Record<(typeof TASK_REPEATS)[number], string> = {
  none: "Does not repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};
export const INVENTORY_TYPES = ["retail", "backbar"] as const;
export const COMMISSION_TYPES = ["percent", "flat"] as const;
export const APPOINTMENT_STATUSES = ["booked", "checked_in", "completed"] as const;

// ---------------------------------------------------------------- primitives

const name = z.string().trim().min(1).max(80);
const money = z.coerce.number().int().min(0).max(100_000_000);
const isoDate = z.iso.date();
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const idParamSchema = z.object({ id: z.uuid() });

// ---------------------------------------------------------------- auth + account

export const signupSchema = z.object({
  companyName: z.string().trim().min(1).max(120),
  firstName: name,
  lastName: name,
  email: z.email().toLowerCase(),
  password: z.string().min(8).max(200),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(1).max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const passwordRules = (pw: string, confirm: string) => ({
  length: pw.length >= 8,
  number: /\d/.test(pw),
  match: pw.length > 0 && pw === confirm,
});

const newPassword = z
  .string()
  .min(8, "At least 8 characters")
  .max(200)
  .regex(/\d/, "Includes a number");

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword,
});

export const accountUpdateSchema = z.object({
  firstName: name,
  lastName: name,
  email: z.email("Enter a valid email address.").toLowerCase(),
  phone: optionalText(40),
});

export const inviteSchema = z.object({
  firstName: name,
  lastName: name,
  email: z.email().toLowerCase(),
  role: z.enum(INVITABLE_ROLES),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(10).max(2000),
  password: newPassword,
});

// ---------------------------------------------------------------- services

export const serviceCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    price: money,
    commissionType: z.enum(COMMISSION_TYPES).default("percent"),
    commission: money,
  })
  .refine((s) => s.commissionType !== "percent" || s.commission <= 100, {
    message: "A percentage can't be more than 100.",
    path: ["commission"],
  })
  .refine((s) => s.commissionType !== "flat" || s.commission <= s.price, {
    message: "A flat commission can't be more than the price.",
    path: ["commission"],
  });
export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;

export const serviceUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  price: money.optional(),
  commissionType: z.enum(COMMISSION_TYPES).optional(),
  commission: money.optional(),
});
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;

// ---------------------------------------------------------------- sales + appointments

export const salesQuerySchema = z.object({
  period: z.enum(["today", "week", "all"]).default("today"),
});

export const saleCreateSchema = z.object({
  serviceId: z.uuid(),
  employeeId: z.uuid(),
  amount: money,
  date: isoDate,
  clientName: optionalText(120),
  paymentMethod: z.enum(PAYMENT_METHODS),
  tipAmount: money.default(0),
});
export type SaleCreateInput = z.infer<typeof saleCreateSchema>;

export const appointmentStatusSchema = z.object({ status: z.enum(APPOINTMENT_STATUSES) });

// ---------------------------------------------------------------- tasks

export const taskCreateSchema = z
  .object({
    type: z.enum(TASK_TYPES),
    title: z.string().trim().min(1).max(200),
    dueDate: isoDate,
    dueTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    assignedTo: z.string().trim().min(1).max(120),
    repeat: z.enum(TASK_REPEATS).default("none"),
  })
  .transform((t) => (t.type === "task" ? { ...t, dueTime: undefined } : t));
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;

export const taskUpdateSchema = z.object({ done: z.boolean() });

// ---------------------------------------------------------------- employees

export const employeeCreateSchema = z.object({
  firstName: name,
  lastName: name,
  employmentType: z.enum(EMPLOYMENT_TYPES),
  phone: optionalText(40),
  serviceIds: z.array(z.uuid()).min(1, "Pick at least one service they perform.").max(200),
});

export const employeeUpdateSchema = z.object({
  firstName: name.optional(),
  lastName: name.optional(),
  employmentType: z.enum(EMPLOYMENT_TYPES).optional(),
  phone: z.string().trim().max(40).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  scheduleDays: z.array(z.enum(WEEKDAYS)).max(7).optional(),
  serviceIds: z.array(z.uuid()).max(200).optional(),
});
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;

// ---------------------------------------------------------------- inventory + expenses

export const inventoryAdjustSchema = z.object({ delta: z.number().int().min(-1000).max(1000) });

export const expenseCreateSchema = z.object({
  amount: z.coerce.number().int().min(1).max(100_000_000),
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().trim().min(1).max(200),
  repeatsMonthly: z
    .union([z.boolean(), z.literal("true"), z.literal("false"), z.literal("on")])
    .optional()
    .transform((v) => v === true || v === "true" || v === "on"),
});

// ---------------------------------------------------------------- platform admin

export const COMPANY_STATUSES = ["invited", "trial", "active", "suspended"] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];
export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  invited: "Invited",
  trial: "Trial",
  active: "Active",
  suspended: "Suspended",
};

const adminPassword = z.string().min(8, "At least 8 characters.").max(200);

export const companyInviteSchema = z.object({
  name: z.string().trim().min(1, "Enter the company name.").max(120),
  city: optionalText(80),
  ownerName: z.string().trim().min(1, "Enter the owner's name.").max(160),
  ownerEmail: z.email("Enter a valid email address.").toLowerCase(),
  planId: z.uuid(),
});
export type CompanyInviteInput = z.infer<typeof companyInviteSchema>;

export const companyPlanSchema = z.object({ planId: z.uuid() });

export const platformSettingsSchema = z.object({
  platformName: z.string().trim().min(1).max(80),
  supportEmail: z.union([z.literal(""), z.email("Enter a valid support email.")]),
  supportPhone: z.string().trim().max(40),
  trialDays: z.coerce.number().int().min(0).max(365),
  inviteDays: z.coerce.number().int().min(1).max(90),
  notifySignup: z.boolean(),
  notifyTrialEnd: z.boolean(),
  notifyOverdue: z.boolean(),
  notifyWeekly: z.boolean(),
  plans: z
    .array(
      z.object({
        id: z.uuid(),
        price: z.coerce.number().int().min(0).max(10_000_000),
        employeeLimit: z.number().int().min(1).max(10_000).nullable(),
      }),
    )
    .max(20),
});
export type PlatformSettingsInput = z.infer<typeof platformSettingsSchema>;

export const adminProfileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(160),
  email: z.email("Enter a valid email address.").toLowerCase(),
  phone: optionalText(40),
});

export const adminPasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: adminPassword,
});

export const emailOnlySchema = z.object({ email: z.email("Enter a valid email address.").toLowerCase() });

export const resetPasswordSchema = z.object({
  token: z.string().min(10).max(2000),
  password: z.string().min(8, "At least 8 characters.").max(200),
});

/** Salon users must also include a number; the admin console only asks for 8+ characters. */
export const salonResetPasswordSchema = resetPasswordSchema.extend({ password: newPassword });

// ---------------------------------------------------------------- reports

const monthParam = z.string().regex(/^\d{4}-\d{2}$/);
export const reportsQuerySchema = z.object({ from: monthParam, to: monthParam });
