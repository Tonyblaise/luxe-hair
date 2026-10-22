export type NavBadge = "tasks" | "lowStock";

export const NAV_ITEMS: { href: string; label: string; badge?: NavBadge }[] = [
  { href: "/", label: "Dashboard" },
  { href: "/sales", label: "Sales Log" },
  { href: "/services", label: "Services" },
  { href: "/reports", label: "Reports" },
  { href: "/tasks", label: "Tasks", badge: "tasks" },
  { href: "/employees", label: "Employees" },
  { href: "/team", label: "Team" },
  { href: "/payouts", label: "Payouts" },
  { href: "/expenses", label: "Expenses" },
  { href: "/inventory", label: "Inventory", badge: "lowStock" },
];

export const isActive = (href: string, pathname: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
