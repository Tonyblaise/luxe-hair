import { Bolt } from "@/components/ui/icons";

function Logo() {
  return (
    <span className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-md bg-navy-700">
        <Bolt size={22} />
      </span>
      <span className="text-[17px] font-bold text-white">Salon Manager</span>
    </span>
  );
}

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-white wide:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-navy-800 px-16 py-12 text-white wide:flex">
        <Logo />
        <div className="flex max-w-[480px] flex-col gap-4">
          <p className="eyebrow text-cyan-400">Admin Console</p>
          <h1 className="text-[48px] leading-[1.1] font-bold">
            Run every salon from <span className="text-yellow-400">one place.</span>
          </h1>
          <p className="text-lg text-white/72">Invite companies, manage plans and keep accounts in good standing.</p>
        </div>
        <p className="text-sm text-white/60">© {new Date().getFullYear()} Salon Manager</p>
      </aside>

      <div className="flex flex-col">
        <div className="flex items-center justify-between bg-navy-800 px-4 py-4 wide:hidden">
          <Logo />
          <span className="eyebrow text-cyan-400">Admin Console</span>
        </div>
        <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-12">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
