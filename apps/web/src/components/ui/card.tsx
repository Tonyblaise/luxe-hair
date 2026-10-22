import Link from "next/link";

export function Card({
  children,
  className = "",
  padding = "p-[clamp(16px,4vw,24px)]",
}: {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <section className={`flex min-w-0 flex-col gap-3.5 rounded-lg bg-white shadow-sm ${padding} ${className}`}>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  caption,
  link,
  children,
}: {
  title: React.ReactNode;
  caption?: React.ReactNode;
  link?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-x-4 gap-y-1">
      <h2 className="min-w-0 text-[20px] leading-tight font-semibold">{title}</h2>
      {caption && <p className="max-w-[50%] pt-1 text-right text-[13px] text-gray-500">{caption}</p>}
      {link && (
        <Link href={link.href} className="shrink-0 pt-0.5 text-sm font-semibold whitespace-nowrap text-cyan-600 hover:underline">
          {link.label} →
        </Link>
      )}
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow text-gray-500">{children}</p>;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-gray-500">{children}</p>;
}
