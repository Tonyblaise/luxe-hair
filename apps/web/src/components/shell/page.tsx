import { formatLongDate, todayDate } from "@luxe-hair/shared";
import { MenuButton } from "./shell";

/** Screen header: eyebrow date, title, and one contextual action. */
export function PageHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:static sm:min-h-20 wide:sticky wide:px-8">
      <MenuButton />
      <div className="min-w-0 flex-1">
        <p className="text-[clamp(11px,3vw,13px)] font-medium tracking-[0.04em] text-gray-500 uppercase">
          {formatLongDate(todayDate())}
        </p>
        <h1 className="truncate text-[clamp(20px,5vw,26px)] leading-tight font-semibold">{title}</h1>
      </div>
      {action}
    </header>
  );
}

/** Content area under the header. */
export function PageBody({ children, narrow = false }: { children: React.ReactNode; narrow?: boolean }) {
  return (
    <main className="p-4 wide:p-8">
      <div className={`mx-auto flex flex-col gap-6 ${narrow ? "max-w-[1100px]" : "max-w-[1600px]"}`}>{children}</div>
    </main>
  );
}

/** Header action label that shortens on phones ("Add Sale" → "+ Add"). */
export function ActionLabel({ label, short }: { label: string; short: string }) {
  return (
    <>
      <span className="max-sm:hidden">{label}</span>
      <span className="sm:hidden">{short}</span>
    </>
  );
}
