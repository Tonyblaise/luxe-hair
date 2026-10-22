export type NavBadge = "tasks" | "lowStock";
export type NavItem = { href: string; label: string; badge?: NavBadge };

/** Grouped by how often each screen is used: daily work first, setup last. */
export const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Today",
    items: [
      { href: "/", label: "Dashboard" },
      { href: "/sales", label: "Sales Log" },
      { href: "/tasks", label: "Tasks", badge: "tasks" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/employees", label: "Employees" },
      { href: "/payouts", label: "Payouts" },
    ],
  },
  {
    label: "Money",
    items: [
      { href: "/expenses", label: "Expenses" },
      { href: "/reports", label: "Reports" },
    ],
  },
  {
    label: "Setup",
    items: [
      { href: "/services", label: "Services" },
      { href: "/inventory", label: "Inventory", badge: "lowStock" },
      { href: "/team", label: "Team" },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

export const isActive = (href: string, pathname: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
