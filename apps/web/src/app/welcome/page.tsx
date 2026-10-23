import type { Metadata } from "next";
import Link from "next/link";
import { Bolt } from "@/components/ui";
import { FeatureIcon, type FeatureIconName } from "./icons";

export const metadata: Metadata = {
  title: "Salon Manager — sales, payouts and stock for Kenyan salons",
  description:
    "Log sales as they happen, pay commissions without a calculator, and track expenses and stock in one place.",
};

const FEATURES: { icon: FeatureIconName; title: string; body: string }[] = [
  {
    icon: "receipt",
    title: "Sales Log",
    body: "Record every service as it happens: service, employee, amount and payment method.",
  },
  {
    icon: "wallet",
    title: "Payouts",
    body: "Commissions are worked out from each service, so you pay staff the right amount every time.",
  },
  {
    icon: "scissors",
    title: "Services",
    body: "Keep one price list with the commission for each service. Change a price once and it updates everywhere.",
  },
  {
    icon: "users",
    title: "Employees & Team",
    body: "Track full-time staff and contractors, and give your manager and front desk their own logins.",
  },
  {
    icon: "package",
    title: "Inventory & Expenses",
    body: "Know when products run low and where the money goes each month.",
  },
  {
    icon: "chart",
    title: "Reports",
    body: "See sales by day, service and employee, so you know which chairs earn the most.",
  },
];

const STEPS = [
  {
    title: "Add your services",
    body: "Enter each service with its price and the commission your stylists earn on it.",
  },
  {
    title: "Add your employees",
    body: "Full-time or contractor, with the services they offer. Invite your manager and front desk to sign in.",
  },
  {
    title: "Log sales, get payouts",
    body: "Record each sale from your phone. Commissions add up automatically, ready to pay at week's end.",
  },
];

const FAQ = [
  { q: "Do I need a card for the free trial?", a: "No. You get 14 days with every feature." },
  {
    q: "Does it work on my phone?",
    a: "Yes. Your team can log sales and check payouts from any phone browser. The admin side works best on a computer.",
  },
  {
    q: "How are commissions worked out?",
    a: "You set a commission amount on each service. Every sale logged against an employee adds to their payout for the period.",
  },
  {
    q: "Can contractors and full-time staff be paid differently?",
    a: "Yes. Each employee is marked as full-time or contractor, and payouts are grouped by employee.",
  },
];

const container = "mx-auto w-full max-w-[1240px] px-[clamp(16px,4vw,32px)]";
const section = "py-[clamp(64px,9vw,112px)]";
const eyebrow = "text-[13px] font-medium tracking-[.04em] uppercase";
const h2 = "text-[clamp(30px,4vw,44px)] leading-[1.15] font-bold tracking-[-.01em] text-pretty";
const ctaButton =
  "inline-flex h-[52px] items-center justify-center rounded-md bg-cyan-400 text-base font-semibold whitespace-nowrap text-white transition-ui hover:bg-cyan-500 active:scale-[.98]";

/** Public marketing page, served at / to signed-out visitors (see proxy.ts). */
export default function LandingPage() {
  return (
    <div className="landing flex min-h-screen flex-col bg-offwhite text-navy-800">
      <Hero />
      <Features />
      <HowItWorks />
      <Questions />
      <ClosingCta />
    </div>
  );
}

function Hero() {
  return (
    <header className="bg-navy-800 text-white">
      <div className={container}>
        <nav className="flex min-h-20 flex-wrap items-center justify-between gap-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-md bg-navy-700">
              <Bolt size={20} />
            </span>
            <span className="text-lg font-bold">Salon Manager</span>
          </Link>
          <div className="flex flex-wrap items-center gap-[clamp(12px,3vw,32px)] text-sm">
            <a href="#features" className="font-medium hover:underline">
              Features
            </a>
            <a href="#faq" className="font-medium hover:underline">
              FAQ
            </a>
            <Link href="/login" className="font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </nav>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-[clamp(40px,6vw,72px)] pt-[clamp(48px,8vw,112px)] pb-[clamp(64px,10vw,128px)]">
          <div className="flex flex-col items-start gap-6">
            <p className={`${eyebrow} text-cyan-400`}>Salon management software</p>
            <h1 className="text-[clamp(40px,6vw,68px)] leading-[1.08] font-bold tracking-[-.01em] text-pretty">
              Know what every chair <span className="text-yellow-400">earns</span>, every day.
            </h1>
            <p className="max-w-[520px] text-[clamp(16px,1.6vw,18px)] leading-[1.6] text-white/85">
              Log sales as they happen, pay commissions without a calculator, and track expenses and stock in one
              place. Prices in KES, built for how Kenyan salons run.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className={`${ctaButton} px-6`}>
                Start Free Trial
              </Link>
              <a
                href="#features"
                className="inline-flex h-[52px] items-center justify-center rounded-md border border-white/40 px-6 text-base font-semibold whitespace-nowrap transition-ui hover:bg-navy-700"
              >
                See Features
              </a>
            </div>
            <p className="text-sm text-white/70">14-day free trial. No card needed.</p>
          </div>
          <DashboardMock />
        </div>
      </div>
    </header>
  );
}

const WEEK = [
  { day: "Mon", height: 45 },
  { day: "Tue", height: 58 },
  { day: "Wed", height: 40 },
  { day: "Thu", height: 66 },
  { day: "Fri", height: 72 },
  { day: "Sat", height: 100 },
  { day: "Sun", height: 84 },
];

const SAMPLE_SALES = [
  { service: "Box braids", employee: "Ava", amount: "KES 4,500" },
  { service: "Fade & beard", employee: "Marcus", amount: "KES 800" },
  { service: "Gel manicure", employee: "Priya", amount: "KES 1,500" },
];

/** A static picture of the dashboard; decoration only. */
function DashboardMock() {
  return (
    <div
      aria-hidden
      className="flex min-w-0 flex-col gap-4 rounded-lg bg-white p-[clamp(16px,3vw,24px)] text-navy-800 shadow-[0_24px_48px_rgba(0,0,0,.25)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase">Today</p>
          <p className="text-lg font-semibold">Luxe Hair</p>
        </div>
        <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold">Open</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          ["Sales", "KES 48,500"],
          ["Services", "23"],
          ["Payouts due", "KES 14,200"],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-md bg-paper p-3">
            <p className="text-xs text-gray-600">{label}</p>
            <p className="text-[clamp(15px,2vw,20px)] font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold">Sales this week</p>
        <div className="grid h-[120px] grid-cols-7 items-end gap-2.5">
          {WEEK.map((d) => (
            <div
              key={d.day}
              className={`rounded-t-sm ${d.height === 100 ? "bg-yellow-400" : "bg-cyan-400"}`}
              style={{ height: `${d.height}%` }}
            />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2.5 text-center text-[11px] text-gray-500">
          {WEEK.map((d) => (
            <span key={d.day}>{d.day}</span>
          ))}
        </div>
      </div>

      <div>
        {SAMPLE_SALES.map((s) => (
          <div key={s.service} className="flex justify-between gap-3 border-t border-gray-200 py-2.5 text-sm">
            <span className="min-w-0 truncate">
              <span className="font-semibold">{s.service}</span>
              <span className="text-gray-600"> · {s.employee}</span>
            </span>
            <span className="font-semibold whitespace-nowrap tabular-nums">{s.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <div className="flex max-w-[680px] flex-col gap-3">
      <p className={`${eyebrow} text-cyan-600`}>{label}</p>
      <h2 className={h2}>{title}</h2>
    </div>
  );
}

function Features() {
  return (
    <section id="features" className={`${section} scroll-mt-4`}>
      <div className={`${container} flex flex-col gap-12`}>
        <SectionHeading label="Features" title="Everything behind the front desk, in one app." />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col gap-3 rounded-lg bg-white p-7 shadow-sm transition-shadow duration-200 hover:shadow-md"
            >
              <span className="grid size-11 place-items-center rounded-md bg-cyan-100">
                <FeatureIcon name={f.icon} />
              </span>
              <h3 className="text-xl font-semibold">{f.title}</h3>
              <p className="text-[15px] leading-[1.6] text-gray-600">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className={`${section} bg-white`}>
      <div className={`${container} flex flex-col gap-12`}>
        <SectionHeading label="How it works" title="Set up in an afternoon." />
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3 border-t-2 border-navy-800 pt-5">
              <span className="text-[32px] leading-none font-bold text-cyan-400 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="text-xl font-semibold">{s.title}</h3>
              <p className="text-[15px] leading-[1.6] text-gray-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** One answer open at a time (`<details name>`), the first open to start. */
function Questions() {
  return (
    <section id="faq" className={`${section} scroll-mt-4 bg-white`}>
      <div className="mx-auto flex w-full max-w-[880px] flex-col gap-8 px-[clamp(16px,4vw,32px)]">
        <h2 className={h2}>Questions</h2>
        <div>
          {FAQ.map((item, i) => (
            <details key={item.q} name="faq" open={i === 0} className="group border-t border-gray-200">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <span aria-hidden className="shrink-0 text-[22px] font-medium text-cyan-600">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">−</span>
                </span>
              </summary>
              <p className="mb-5 max-w-[720px] text-[15px] leading-[1.6] text-gray-600">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <footer className="bg-navy-800 text-white">
      <div className={container}>
        <div className="flex flex-wrap items-center justify-between gap-8 py-[clamp(64px,9vw,96px)]">
          <div className="flex max-w-[640px] flex-col gap-3">
            <h2 className={h2}>
              Close the day knowing your <span className="text-yellow-400">numbers</span>.
            </h2>
            <p className="text-[17px] text-white/85">Try every feature free for 14 days.</p>
          </div>
          <Link href="/signup" className={`${ctaButton} px-7`}>
            Start Free Trial
          </Link>
        </div>
        <div className="flex flex-wrap justify-between gap-4 border-t border-white/12 py-6 text-sm text-white/70">
          <p>© {new Date().getFullYear()} Salon Manager · Nairobi, Kenya</p>
          <div className="flex gap-6 text-white/85">
            <a href="#features" className="hover:underline">
              Features
            </a>
            <a href="mailto:support@salonmanager.co.ke" className="hover:underline">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
