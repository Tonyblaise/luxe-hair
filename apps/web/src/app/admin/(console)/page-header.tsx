/** Admin page heading: eyebrow, 32px title and one action on the right (no header bar in the console). */
export function AdminPageHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow text-gray-500">{eyebrow}</p>
        <h1 className="text-[clamp(26px,4vw,32px)] leading-tight font-bold">{title}</h1>
      </div>
      {action}
    </div>
  );
}

export function AdminBody({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className={wide ? "p-4 sm:p-8" : "p-4 sm:p-10"}>
      <div className={`mx-auto flex flex-col gap-6 ${wide ? "max-w-[1440px]" : "max-w-[1240px]"}`}>{children}</div>
    </main>
  );
}
