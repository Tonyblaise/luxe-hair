import { Bolt } from "@/components/ui/icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-navy-800 px-4 py-12">
      <div className="flex w-full max-w-[400px] flex-col gap-6">
        <div className="flex items-center justify-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-navy-700">
            <Bolt size={20} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[17px] font-bold text-white">Luxe Hair</span>
            <span className="text-xs text-white/72">Sign in to your salon</span>
          </span>
        </div>
        <div className="rounded-lg bg-white p-[clamp(20px,5vw,32px)] shadow-xl">{children}</div>
      </div>
    </main>
  );
}
