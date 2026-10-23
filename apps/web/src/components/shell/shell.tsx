"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Bolt } from "@/components/ui/icons";
import { NAV_SECTIONS, isActive, type NavBadge } from "./nav";

type ShellProps = {
  companyName: string;
  userName: string;
  counts: Record<NavBadge, number>;
  children: React.ReactNode;
};

const DrawerContext = createContext<() => void>(() => {});
export const useOpenDrawer = () => useContext(DrawerContext);

export function Shell({ companyName, userName, counts, children }: ShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <DrawerContext.Provider value={() => setDrawerOpen(true)}>
      <div className="wide:grid wide:h-dvh wide:grid-cols-[232px_1fr]">
        {/* ≥ 900: fixed sidebar */}
        <aside className="hidden flex-col gap-8 overflow-y-auto bg-navy-800 px-4 py-6 wide:flex">
          <Logo companyName={companyName} />
          <NavList pathname={pathname} counts={counts} />
          <AccountFooter userName={userName} active={isActive("/account", pathname)} />
        </aside>

        {/* 640–899: sticky top bar with a horizontally scrolling nav */}
        <div className="sticky top-0 z-30 hidden flex-col gap-3 bg-navy-800 px-3 pt-4 pb-3 sm:flex wide:hidden">
          <Logo companyName={companyName} />
          <nav aria-label="Main" className="-mx-3 flex items-center gap-1 overflow-x-auto px-3 [scrollbar-width:none]">
            {[...NAV_SECTIONS, { label: "Account", items: [{ href: "/account", label: "Account" }] }].map((section, i) => (
              <div key={section.label} role="group" aria-label={section.label} className="flex shrink-0 items-center gap-1">
                {i > 0 && <span aria-hidden className="mx-1.5 h-6 w-px bg-white/20" />}
                {section.items.map((item) => (
                  <NavLink key={item.href} item={item} pathname={pathname} counts={counts} compact />
                ))}
              </div>
            ))}
          </nav>
        </div>

        <div className="min-w-0 wide:overflow-y-auto">{children}</div>
      </div>

      {/* < 640: drawer opened from the page header's hamburger */}
      {drawerOpen && (
        <div className="sm:hidden">
          <div aria-hidden className="fixed inset-0 z-[25] bg-[rgba(15,23,42,.4)]" onClick={() => setDrawerOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-y-0 left-0 z-[26] flex w-[min(300px,84vw)] flex-col gap-8 overflow-y-auto bg-navy-800 px-4 py-6"
          >
            <div className="flex items-start justify-between gap-2">
              <Logo companyName={companyName} />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="grid size-11 place-items-center rounded-md text-2xl text-white/72 hover:bg-navy-700 hover:text-white"
              >
                ×
              </button>
            </div>
            <NavList pathname={pathname} counts={counts} />
            <AccountFooter userName={userName} active={isActive("/account", pathname)} />
          </div>
        </div>
      )}
    </DrawerContext.Provider>
  );
}

function Logo({ companyName }: { companyName: string }) {
  return (
    <Link href="/" className="flex items-center gap-3 px-1">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-navy-700">
        <Bolt size={20} />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[17px] font-bold text-white">{companyName}</span>
        <span className="text-xs text-white/72">Luxe Hair</span>
      </span>
    </Link>
  );
}

function NavList({ pathname, counts }: { pathname: string; counts: ShellProps["counts"] }) {
  return (
    <nav aria-label="Main" className="flex flex-col">
      {NAV_SECTIONS.map((section, i) => (
        <div
          key={section.label}
          role="group"
          aria-label={section.label}
          className={`flex flex-col gap-1 ${i > 0 ? "mx-2 mt-3 border-t border-white/15 pt-3 [&>a]:-mx-2" : ""}`}
        >
          {section.items.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} counts={counts} />
          ))}
        </div>
      ))}
    </nav>
  );
}

function NavLink({
  item,
  pathname,
  counts,
  compact = false,
}: {
  item: { href: string; label: string; badge?: NavBadge };
  pathname: string;
  counts: ShellProps["counts"];
  compact?: boolean;
}) {
  const active = isActive(item.href, pathname);
  const count = item.badge ? counts[item.badge] : 0;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex h-11 shrink-0 items-center justify-between gap-2 rounded-md px-3.5 text-[15px] whitespace-nowrap transition-ui ${
        active
          ? "bg-navy-700 font-semibold text-white shadow-[inset_3px_0_0_var(--color-yellow-400)]"
          : "font-medium text-white/72 hover:bg-navy-700/60 hover:text-white"
      } ${compact ? "text-sm" : ""}`}
    >
      {item.label}
      {count > 0 && (
        <span
          className={`grid h-[22px] min-w-[22px] place-items-center rounded-full px-1.5 text-xs font-semibold text-navy-800 ${
            item.badge === "tasks" ? "bg-cyan-400" : "bg-yellow-400"
          }`}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

function AccountFooter({ userName, active }: { userName: string; active: boolean }) {
  return (
    <Link
      href="/account"
      aria-current={active ? "page" : undefined}
      className="mt-auto flex items-center gap-3 border-t border-navy-700 px-1 pt-4"
    >
      <Avatar name={userName} size={36} tone="cyan" />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-semibold text-white">{userName}</span>
        <span className={`text-[13px] ${active ? "text-yellow-400" : "text-white/72"}`}>Account Settings →</span>
      </span>
    </Link>
  );
}

export function MenuButton() {
  const open = useOpenDrawer();
  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open menu"
      className="grid size-11 shrink-0 place-items-center rounded-md border border-gray-300 bg-white sm:hidden"
    >
      <span className="flex w-[18px] flex-col gap-1">
        <span className="h-0.5 rounded bg-navy-800" />
        <span className="h-0.5 rounded bg-navy-800" />
        <span className="h-0.5 rounded bg-navy-800" />
      </span>
    </button>
  );
}
