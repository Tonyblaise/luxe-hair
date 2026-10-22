"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Bolt } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { adminSignOut } from "./actions";

const NAV = [
  { href: "/admin", label: "Companies" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/profile", label: "Profile" },
];

const isActive = (href: string, pathname: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

export function AdminShell({ name, email, children }: { name: string; email: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh wide:grid wide:grid-cols-[248px_minmax(0,1fr)]">
      <WelcomeToast />
      {/* ≥ 900: sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-8 overflow-y-auto bg-navy-800 px-4 py-6 wide:flex">
        <Logo />
        <div className="flex flex-col gap-2">
          <p className="px-3 text-xs font-medium tracking-[0.04em] text-white/60 uppercase">Menu</p>
          <nav aria-label="Admin" className="flex flex-col gap-1">
            {NAV.map((item) => (
              <NavLink key={item.href} {...item} active={isActive(item.href, pathname)} />
            ))}
          </nav>
        </div>
        <div className="mt-auto flex flex-col gap-3 border-t border-navy-700 pt-4">
          <Link href="/admin/profile" className="flex items-center gap-3 rounded-md p-1 transition-ui hover:bg-navy-700">
            <Avatar name={name} size={36} tone="cyan" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-white">{name}</span>
              <span className="block truncate text-xs text-white/72">{email}</span>
            </span>
          </Link>
          <form action={adminSignOut}>
            <button
              type="submit"
              className="h-10 w-full rounded-md border border-navy-700 text-sm font-semibold text-white/90 transition-ui hover:bg-navy-700"
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* < 900: top bar */}
      <div className="sticky top-0 z-30 flex flex-col gap-3 bg-navy-800 px-4 pt-4 pb-3 wide:hidden">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <form action={adminSignOut}>
            <button type="submit" className="h-9 rounded-md border border-navy-700 px-3 text-sm font-semibold text-white/90">
              Sign Out
            </button>
          </form>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href, pathname)} />
          ))}
        </nav>
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Logo() {
  return (
    <Link href="/admin" className="flex items-center gap-3 px-1">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-navy-700">
        <Bolt size={20} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[17px] font-bold text-white">Salon Manager</span>
        <span className="text-xs text-white/72">Admin Console</span>
      </span>
    </Link>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-11 shrink-0 items-center gap-3 rounded-md px-3 text-[15px] whitespace-nowrap transition-ui ${
        active ? "bg-navy-700 font-semibold text-white" : "font-medium text-white/72 hover:bg-navy-700 hover:text-white"
      }`}
    >
      {active && <span aria-hidden className="size-1.5 rounded-full bg-yellow-400" />}
      {label}
    </Link>
  );
}

/** Shows "Welcome back" once after sign-in, then drops the param from the URL. */
function WelcomeToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const welcome = params.get("welcome");

  useEffect(() => {
    if (welcome === null) return;
    toast(welcome ? `Welcome back, ${welcome}` : "Welcome back");
    router.replace(pathname, { scroll: false });
  }, [welcome, toast, router, pathname]);

  return null;
}
