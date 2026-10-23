# Salon Manager — design spec

Extracted from Claude Design project `6a35e124-e709-4a43-8cef-d171b03560bc`, file `Salon Manager.dc.html` (one responsive app; `Salon Manager Mobile.dc.html` only shows it in 390px phone frames). Design system: "Focus Digital" (`colors_and_type.css`).

Project decisions that override the design:
- Employee has no email, start date or working hours (schema doc wins), and no job role: employees are described by the services they perform (picked when adding them).
- Payment methods are Card / Cash / M-Pesa (design says Other).
- The salon nav is grouped, with divider lines between groups — Overview (Dashboard, Reports), Operations (Sales Log, Payouts, Expenses, Inventory), Work (Tasks, Services), People (Employees, Team) — instead of the design's flat list.
- "Today" is the real date in Africa/Nairobi (design hardcodes 2026-10-14). Amounts are real KES values (design multiplies USD × 130).

## Tokens

Font: Poppins 400/500/600/700 (Google Fonts). Body line-height 1.65, antialiased. All numbers `tabular-nums`.

| Token | Value |
| --- | --- |
| navy-900 / 800 / 700 / 600 / 500 | #14205A / #1E2B6B (brand) / #2A3A85 / #3B4DA0 / #5B6BB5 |
| cyan-600 / 500 / 400 / 300 / 100 | #2BA8E0 / #3BB4E8 / #4FC3F7 (primary action) / #7DD3FA / #E0F4FD |
| yellow-600 / 500 / 400 / 200 | #D9B026 / #E8BE2E / #F4CB45 / #FCE9A0 |
| offwhite / paper / white / black | #EEF1F2 / #F6F8FA / #FFFFFF / #0A0F1F |
| gray-100 … 700 | #F1F3F5, #E1E5EB, #D5DAE0, #B1B8C2, #7C8694, #525C6B, #364152 |
| success / danger | #2ECC71 / #E74C3C |

Usage: page bg offwhite; text navy-800; links cyan-600; muted text gray-600 / gray-500; dividers 1px gray-200; input borders gray-300.

Radii: sm 6, md 10, lg 16, xl 24, pill 999.
Shadows: sm `0 1px 2px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.06)`; md `0 4px 8px rgba(15,23,42,.06), 0 2px 4px rgba(15,23,42,.04)`; lg `0 12px 24px rgba(15,23,42,.10), 0 4px 8px rgba(15,23,42,.04)`; xl `0 24px 48px rgba(30,43,107,.18)`.
Motion: 150ms ease-out (`cubic-bezier(.22,.61,.36,1)`).
Type: eyebrow 13/500 uppercase 0.04em. Headings letter-spacing -0.01em, `text-wrap: balance`. `::selection` yellow-400 bg, navy text.
Responsive sizes via clamp: card padding `clamp(16px,4vw,24px)`, page h1 `clamp(20px,5vw,26px)`, KPI value `clamp(20px,2.2vw,28px)`.

## Components

- **Bolt** (logo + inventory alert): 24 viewBox, fill yellow-400, path `M13 2 3 14h7l-1 8 10-12h-7l1-8z`. Logo: 20px bolt in a 36×36 navy-700 tile, radius 10.
- **Check**: stroke 2, round caps/joins, path `M20 6 9 17l-5-5`.
- **Card**: white, radius 16, shadow-sm, padding `clamp(16px,4vw,24px)`, column gap 12–14. Title h2 20/600. Header row: title + right caption (13px gray-500) or link "X →" (14/600 cyan-600).
- **KPI tile**: card; label 13/500 uppercase 0.04em gray-500; value clamp(20–28px)/700 nowrap lh 1.1; sub 14px gray-600. Grid `repeat(auto-fit,minmax(min(100%,200px),1fr))`, gap `clamp(12px,3vw,24px)`. Mini variant (inside cards): bg paper, radius 10, label 12px, value `clamp(18px,5vw,24px)`.
- **Buttons**: primary h44 (48 in forms/modals), px `clamp(12px,3vw,20px)`, radius 10, cyan-400 bg, white 15/600, hover cyan-500, active scale(.98), disabled gray-300 bg. Navy: navy-800 bg, hover navy-700, h34–36 (44 mobile), 13–14px. Outline: white, 1px gray-300 (navy-800 for Check In), navy text, hover paper, h36–40. Ghost Delete: h32, transparent, gray-500 13/500, hover paper bg + navy text.
- **Pill filter**: h36, px14, radius 999, 13/500. Active navy fill white text; inactive white, 1px gray-300, navy text. Labels carry counts "Open (6)".
- **Segmented**: h44, radius 10, 14/600. Active 2px cyan-400 border on cyan-100; inactive 1px gray-300 on white.
- **Chip**: 12/600, `4px 10px`, radius 999. info = cyan-100 (Active, Checked In, Today, In Stock); neutral = gray-100 + gray-600 text (Completed, Paid, Inactive, Done, Upcoming); warn = yellow-200 (Overdue, Low Stock, Invited).
- **Field/Select**: h44, 1px gray-300, radius 10, px14 (select px10), 15px navy; focus border cyan-400. Label wraps field: column gap 6, 13/500 gray-600. Form grids `repeat(auto-fit,minmax(220px,1fr))` gap 16. Checkbox 18px `accent-color` navy-800.
- **Avatar**: initials circle; lists 32–40px cyan-100 bg navy text; profile/account 52–64px navy bg white text.
- **List row**: border-top 1px gray-200, padding 10–14px 0, CSS grid.
- **Progress bar**: 6px track gray-100 radius 999, fill cyan-400 (navy for services), width = % of max.
- **Task checkbox**: 28px (24 dashboard), radius 8. Open: 2px gray-400 border white; done: navy fill + white check.
- **Toast**: fixed bottom 24 centred, navy bg, white 14/500, radius 10, padding 14px 20px, shadow-lg, cyan check 18px; auto-hide 3.5s.
- **Modal**: desktop centred `min(520px,100%-32px)`, radius 16, padding 32, gap 16, shadow-xl, backdrop `rgba(15,23,42,.4)`. Header h2 22/600 + 44px "×". Mobile: bottom sheet (left/right/bottom 0, radius `24px 24px 0 0`, max-height 92vh, padding `20px 16px calc(24px + env(safe-area-inset-bottom))`).

## Shell

- **Wide ≥ 900**: grid `232px | 1fr`, 100vh, aside and main scroll independently. Sidebar navy-800, padding `24px 16px`, gap 32. Logo block: bolt tile + "Luxe Hair" 17/700 white over "Salon Manager" 12px white/72%. Nav buttons h44, px14, radius 10, 15px; inactive transparent white/72% 500; active navy-700 bg, white 600, `box-shadow: inset 3px 0 0 #F4CB45`. Badges: pill h22, 12/600 navy text — Tasks cyan-400 (open tasks due ≤ today), Inventory yellow-400 (low-stock count). Footer (margin-top auto, border-top navy-700): 36px cyan avatar initials, name, "Account Settings →".
- **Tablet 640–899**: sidebar becomes sticky top bar (padding `16px 12px 12px`), nav scrolls horizontally, extra "Account" item, footer hidden.
- **Mobile < 640**: aside hidden. Sticky header min-h 64 with hamburger (44×44, 1px gray-300, radius 10, three 18×2 navy bars) → left drawer `min(300px,84vw)` navy with logo, "×", nav, footer; backdrop rgba(15,23,42,.4). Navigating closes it. No bottom tab bar.
- **Header**: white, border-bottom gray-200, min-h 80 (64 mobile), padding `12px 32px` (wide) / `12px 16px`. Left: eyebrow date "WEDNESDAY, OCTOBER 14" (`clamp(11px,3vw,13px)` uppercase gray-500) over h1 title. Right: one primary action (mobile shortens to "+ Add" / "+ Invite" / "Pay All").
- Titles: Dashboard "Good morning, {Salon}"; Sales Log; Services; Reports; "Tasks & Reminders"; Employees; Team; Payouts; Expenses; Inventory; "Account Settings".
- Actions: Sales "Add Sale", Services "Add Service", Tasks "Add Task", Expenses "Add Expense", Employees "Add Employee", Team "Invite Member", Payouts "Pay All Unpaid".
- Content padding 32 (wide) / 16; inner `max-width:1600px` column gap 24; Team and Account max 1100.
- Nav order: Dashboard, Sales Log, Services, Reports, Tasks, Employees, Team, Payouts, Expenses, Inventory.

## Screens

Money: `KES 12,345`; charts short form `KES 40k` / `KES 1.2M`.

### Dashboard
- KPIs: Today's Revenue ("N sales logged today"), {Month} Revenue ("Services, {Mon} 1–{d}"), {Month} Expenses ("N entries logged"), Est. Profit ("after KES X commissions owed").
- Grid `repeat(auto-fit,minmax(min(100%,420px),1fr))`.
- Left "Today's Appointments" (caption "2 in chair · 6 still to arrive"): rows `64px | 1fr | auto` — time 14/600; client 15/600 over "Service · StaffFirst" 13px gray-600; status: booked → outline "Check In" (h36, navy border) → checked_in chip info "Checked In" → completed chip neutral "Completed".
- Right: "Tasks & Reminders" + "All Tasks →" (≤5 open due ≤ today, 24px checkbox, title 14/600, meta 12px, chip; empty "Nothing due today."); "Payouts Owed" + "Payouts →" (big 30/700 figure, "week of Oct 12–18 · pays Sunday", top 4 unpaid staff); "{Month} Expenses" + "Expense Log →" (5 categories, totals, 6px cyan bars); "Low Stock" + "Inventory →" ("Name — X left · reorder at Y"; empty "Everything is stocked above reorder level.").
- Mobile: one column.

### Sales Log
- Card "Entries", pills Today / This Week / All; mini KPIs Sales (count), Revenue.
- Rows: service 15/600 over "Staff · Client · Payment · Today|Oct 13" 13px; price 15/700; ghost Delete. Empty "No sales logged for this period."
- Add Sale modal: Service select ("Name · KES price"; sets price), Employee select (active only; warning "{First} isn't set up for this service. You can still log it."), Price, Date, "Client (optional)" placeholder "e.g. Maya Torres", Payment segmented, button "Add Sale · KES X". Toasts "Sale added · KES x" / "Sale removed".

### Services
- Card "Service Menu", caption "N services". Inline-editable rows: borderless name input 15/600 (border on hover, cyan on focus); right: Delete (if unused) else "N employees". Auto-fit grid (min 130px): Amount number input (h40); Commission number + select (`%` / `KES`, 80px); "Employee earns" value 15/700. Labels 12/500 gray-500.
- Add Service modal: name (placeholder "e.g. Keratin Treatment"; duplicate "A service with this name already exists."), Amount, Commission + select ("% of price" / "KES per service"), hint "Employee earns KES X each time." or "Set a percentage of the price or a flat amount.". % ≤ 100, flat ≤ price.

### Reports
- Controls: From/To month selects (min-width 150, last 12 months), caption "12 months · {Month} is month to date", presets Last 3 Months / Last 6 Months / Year to Date / Last 12 Months.
- KPIs: Sales ("Avg KES x / month"), Expenses (avg), Profit ("x% margin"), Best Month ("Sep 2026", "KES x in sales").
- "Sales vs Expenses by Month": legend Sales cyan-400, Expenses navy-800; selected-month summary box (paper): Month / Sales / Expenses / Profit · margin. Bar chart: y-axis 52px, plot h280, dashed gray-200 gridlines, solid gray-400 baseline, ticks "KES 40k"; paired bars width 28% (38% if > 6 months), max 36px, top radius 4; partial month 60% opacity; click selects column (tint `rgba(79,195,247,.12)`, radius `8px 8px 0 0`); x labels 12px, selected 600 navy.
- "Expenses by Category": stacked bar per month, 70% width (max 44). Colors: Rent & Utilities navy-800, Products & Supplies #A9DEF7, Payroll cyan-400, Marketing yellow-400, Equipment gray-400.
- "{Month} Breakdown": total, categories sorted by % (swatch, %, total, bar). Footnote "Click any month in either chart to review it here."
- "Sales by Employee" (range caption): desktop table Employee | Appts | Avg Ticket | Comm. (`1fr 64px 120px 120px`) with sales value + bar; mobile "N appts · avg X · comm. Y".
- "Sales by Service": Service | Booked | Price | Share (`1fr 64px 110px 64px`), navy bars; mobile "N booked · KES x each · y% share".
- "Monthly Summary": Month | Sales | Expenses | Profit | Margin (`minmax(120px,1.4fr) repeat(4,1fr)`), newest first, clickable, selected row cyan-100 radius 10; mobile two-column.

### Tasks & Reminders
- Card "To Do", pills Open / Today / Overdue / Upcoming / Done with counts.
- Rows `36px | 1fr | chip | Delete` (mobile chip under title): 28px checkbox; title 15/600 (done: line-through gray-500); meta "Task|Reminder · Who · Repeats weekly".
- Chips: Overdue "Overdue · Oct 13" warn; Today "Today" / "Today 4:00 PM" info; Upcoming "Tomorrow" / "Oct 16" (+time) neutral; Done neutral.
- Completing a repeating task creates the next one; toast "Done · next one set for Oct 21". Empty "Nothing here. You're all caught up."
- Add modal: segmented Task / Reminder; "What needs doing" (placeholder "e.g. Restock towels" / "e.g. Confirm Saturday bookings"); Due date; "Remind at" time (reminders); "Assign to" Owner / Front desk / each staff; "Repeats" Does not repeat / Daily / Weekly / Monthly; button "Add Task" / "Add Reminder".

### Employees
- Master/detail `minmax(320px,400px) | 1fr` at ≥ 1100; below, list or detail.
- List card (padding 20): pills Active / Inactive / All with counts. Row buttons `40px | 1fr | auto`, padding 12, radius 10; selected 2px cyan-400 border on cyan-100. Avatar 40, name 15/600, "Services · Full-time" 13px, dot 8px + "Working today" (cyan) / "Off today" (gray-300) / "Inactive" (gray-400).
- Detail card (padding `clamp(20px,4vw,32px)`, gap 28): navy avatar clamp(52–64), name clamp(22–26)/700, "Type · Services" + status chip, outline "Deactivate"/"Reactivate". Mini KPIs Sales This Week / Payout This Week / Appointments Today (mobile "Sales · Wk", "Payout · Wk", "Appts Today"). "DETAILS": first/last name, Employment type, Phone — save live. "WEEKLY SCHEDULE · N days a week": 7 toggles (grid 7, h44; on navy fill, off white 1px gray-300; Mon…Sun, mobile "Mo"). "SERVICES THEY PERFORM": pill toggle per service.
- Add Employee card (max 720): names, Employment type, Phone, service toggles (at least one); note "You can set their schedule after adding them."; button "Add Employee".
- Mobile detail has "← All Employees" (cyan 15/600).

### Team (app users)
- Card "App Users", sub "People who can sign in to manage the salon. Separate from your employee list.", pills All / Active / Invited.
- Rows `40px | 1fr | actions`: avatar cyan-100 (active) or gray-100 + dashed gray-400 border (invited); name + chip (Active info / Invited warn); "Role · email" (ellipsis); last activity ("Active today, 9:12 AM" / "Invited Oct 11"). Actions h36: invited → "Resend" (navy) + "Revoke"; others "Remove"; owner none.
- Invite modal: sub "They'll get a link to set a password. Invites expire after 7 days."; Full name, Email ("This email already has an account."), Role Manager / Front Desk / Accountant with hints — Manager "Runs the salon day to day: sales, payouts, expenses, employees.", Front Desk "Logs sales, manages tasks and inventory.", Accountant "Views reports, expenses and payouts."; button "Send Invite".

### Payouts
- KPIs: Service Sales / Commissions / Tips / Still Owed.
- Card "Weekly Payouts · Oct 12–18", caption "Click a stylist to see the breakdown". Desktop table (min-width 760, x-scroll): Staff (avatar 32 + name/role) | Service Sales | Service Comm. | Retail Comm. | Tips | Payout (bold) | Status ("Mark Paid" navy button / "Paid" chip). Headers 12/500 uppercase. Row click expands paper panel indented 42px with per-service lines (name | "8 × KES 9,750" | "45%" or "KES x each" | commission) + "Retail sales" line at 10%.
- Mobile: stacked rows (avatar 36, name, "Sales X · Tips Y", total 17/700; "Service X · Retail Y"; 44px Mark Paid).
- Mark Paid adds a "Commission payout · Name" Payroll expense + toast.
- "Commission Rates" card: sub "Pulled from your service menu. Change rates in Services.", link "Edit in Services →"; grid `auto-fill minmax(260px)`: service + "KES x service" vs rate + "Earns KES y".

### Expenses
- "{Month} by Category": total 20/700 right; category bars; section "RECURRING · AUTO-ADDED ON THE 1ST": vendor + "KES x/mo".
- "Expense Log": pills All + 5 categories. Desktop rows (min-width 620): date "Oct 14" | vendor 600 (+ "Recurring monthly") | category | "Receipt attached" / "—" | amount right. Mobile: vendor over "Oct 14 · Category", amount 15/700, "Receipt".
- Add modal: Amount + Category (two columns), Date (defaults to today, no future dates), "Vendor or description" (placeholder "e.g. Kerra Lab color order"), compact outline receipt button "Snap or Attach Receipt" (natural width, left-aligned) (`accept=image/* capture=environment`, then "Receipt: filename"), "Repeats monthly" checkbox, button "Add Expense". Toast "Expense added · KES x".

### Inventory
- Alert banner when low: navy card radius 16 padding `20px 24px`, yellow bolt 22px, "N products below reorder level" 16/600, names white/72%, cyan "Show Low Stock" button.
- Card: pills All / Retail / Backbar / Low Stock; right "Stock value at cost **KES x**".
- Desktop table (min-width 720): Product (name over "Brand · reorder at N") | Type | Cost | Price ("—" backbar) | On Hand (32px − / + stepper) | Status chip (Low Stock warn / In Stock info). Mobile: name over "Brand · Type · Price", chip, "Reorder at N", 44px stepper.

### Account Settings
- Two cards, auto-fit grid (min 420).
- "Your Details": 56px navy avatar, "Owner · {Salon}"; first/last name, Phone, Email ("Enter a valid email address."), Role (disabled, note "Roles are managed by the salon owner."); Discard (outline) + Save Changes (h48), disabled until dirty.
- "Change Password": sub "You'll stay signed in on this device. Other devices will be signed out."; Current / New / Confirm, "Show passwords" checkbox; rules box (paper) with 20px dots (navy + white check when met): "At least 8 characters", "Includes a number", "New passwords match"; button "Update Password".

## Behaviour
- Every mutation shows a toast.
- Payout maths: service commission = count × price × rate% (or count × flat); retail commission 10% of retail; total = service + retail commission + tips. Pay week Mon–Sun, pays Sunday.
