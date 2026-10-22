export type NavBadge = "tasks" | "lowStock";
export type NavItem = { href: string; label: string; badge?: NavBadge };

/** Overview first, day-to-day money and stock in the middle, setup last. */
export const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard" },
      { href: "/tasks", label: "Tasks", badge: "tasks" },
      { href: "/reports", label: "Reports" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/sales", label: "Sales Log" },
      { href: "/payouts", label: "Payouts" },
      { href: "/expenses", label: "Expenses" },
      { href: "/inventory", label: "Inventory", badge: "lowStock" },
    ],
  },
  {
    label: "Setup",
    items: [
      { href: "/employees", label: "Employees" },
      { href: "/services", label: "Services" },
      { href: "/team", label: "Team" },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export const isActive = (href: string, pathname: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
