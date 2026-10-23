# Salon Admin (platform console) — design spec

Extracted from Claude Design project `6a35e124-e709-4a43-8cef-d171b03560bc`, file `Salon Admin.dc.html`. Same "Focus Digital" tokens as `docs/design-spec.md`.

**Purpose:** a platform super-admin console across all salons — "Admin Console — Run every salon from **one place**." / "Invite companies, manage plans and keep accounts in good standing." The user is a "Platform Admin" (separate from salon users). Lives at `/admin` in the web app.

Project decisions that override the design:
- The product is called Luxe Hair: the design's "Salon Manager" logo text and © line read "Luxe Hair", and so does the default platform name in Settings.
- The design is desktop-only (`min-width:1280px`). We keep its desktop layout and make it degrade like the main app (top nav below 900px, scrolling table, stacked grids) instead of forcing horizontal scroll.
- Invites, resends, reset-owner-password and admin "Forgot password" are emailed through Resend. The invite and reset dialogs confirm "Sent to {email}" with the link behind "Copy link instead"; when the email isn't sent (no `RESEND_API_KEY`, or Resend refuses it) they show the copyable link as before, and in development the link is logged to the console.
- Password rule for the admin is "at least 8 characters" (the design's rule).
- The design's demo hint under Sign In is dropped.

## Shell
- Grid `248px | minmax(0,1fr)`, page bg offwhite. Sidebar sticky 100vh, navy-800, padding `24px 16px`, gap 32: logo row (Bolt tile + "Salon Manager" / "Admin Console"), "MENU" eyebrow (12/500 uppercase 0.04em, white/60%), nav buttons h44 px12 gap12 radius 10 15px — Companies, Settings, Profile. Active: navy-700 bg, 600, a 6px yellow-400 dot before the label (not the inset bar). Footer (margin-top auto): profile chip (36px cyan avatar, name 14/500 white, email) → Profile; "Sign Out" button.
- No header bar: each page starts with eyebrow + h1 (32/700, -0.01em) and a primary button on the right. Companies eyebrow "ACCOUNTS" (main padding 32, max 1440); Settings "PLATFORM" and Profile "ACCOUNT" (padding 40, max 1240). Gap 24.
- Toast as the main app ("Welcome back, {first}", "Signed out", etc.).

## Login
- Split screen, two equal columns. Left navy panel (padding `48px 64px`, space-between): Bolt 22 + "Salon Manager"; middle (max 480, gap 16) eyebrow "Admin Console", h1 48/700 lh 1.1 white "Run every salon from one place." with "one place" in yellow-400, tagline; bottom "© {year} Salon Manager". Right panel centred, forms max 400 gap 20.
- Sign In: "Sign In" / "Use your platform admin account."; Email (placeholder `admin@salonmanager.co.ke`); Password with "Forgot password?" link in the label row and a Show/Hide toggle inside the input (absolute right 6, top 6, h36, 13/600). Error box (white, 1px gray-300, radius 10, padding `12px 14px`): "Enter a valid email address." / "Incorrect email or password." Button "Sign In" h48.
- Reset: subtitle "Enter your email and we'll send you a link to set a new password."; Email; "Send Reset Link". After: hide fields, subtitle "If an account exists for {email}, a reset link is on its way. It expires in 1 hour." Link "← Back to Sign In".

## Companies (default)
- Header "ACCOUNTS" / "Companies", button "Invite Company" (h44, px20).
- KPIs, 4 columns gap 24 (card radius 16, shadow-sm, padding 24, gap 6): Active Companies ("Paying and signed in"), On Trial ("{trialDays}-day free trial"), Pending Invites ("{n} expired"), Staff on Platform ("Across active and trial salons").
- Table card (padding 24). Toolbar: pills All / Active / Trial / Invited / Suspended with counts (h36, 14px); search input 300×40 "Search company, owner or email" (name, owner, email; case-insensitive).
- Columns `minmax(0,1.5fr) minmax(0,1.5fr) 112px 44px 92px 112px 104px` gap 12; header 12/500 uppercase gray; rows padding 12, top border gray-200, 14px:
  - Company: 36px rounded-square (radius 10) initials tile (first letters of words, split on spaces and "&", max 2) + name over city. Tile: active/trial navy bg white text; invited white + 1px dashed gray-400 navy text; suspended gray-100 navy text.
  - Owner: name over email. Plan: inline select h38 (Starter / Growth / Pro) → toast "{name} moved to {plan}". Staff: number or "—". Status chip (12/600, `4px 10px`): Active cyan-100; Trial white + 1px cyan-400 border; Invited yellow-200; Suspended gray-100/gray-600.
  - Last Active: "Active now" / "Today, 10:05 AM" / "Yesterday" / "9 days left" (trial) / "Invited Oct 19" / "Oct 9 · expired" / "Payment overdue" or "Suspended Oct 22".
  - Actions: "Manage ▾" dropdown (top 40, right 0, min-w 200, white, radius 10, shadow-lg, padding 6; items h40 radius 6 14/500; outside click closes):
    - Active/Trial: Reset Owner Password ("Reset link sent to {email}"), Suspend ("{name} suspended").
    - Invited: Resend ("Invite resent to {email}"), Revoke Invite ("Invite to {name} revoked").
    - Suspended: Reactivate ("{name} reactivated"), Delete Company ("{name} deleted").
  - Empty: "No companies match this filter."
- Invite Company modal (560 wide, padding 32, gap 20): title + sub "The owner gets an email link to set up their salon account. Invites expire after {inviteDays} days."; 2-col grid gap 16: Company name ("e.g. Halo Beauty Lounge"), City ("e.g. Nairobi"), Owner name ("e.g. Wanjiku Kamau"), Plan select, Owner email (`owner@company.co.ke`; "A company with this owner email already exists."). Hint "{Plan}: KES {price} / month, up to {limit} employees" (or "unlimited employees") + ". New companies start with a {trialDays}-day trial." Buttons Cancel (outline) + Send Invite (disabled until name, owner and valid email). On send: row on top as Invited, staff 0; filter back to All; toast "Invite sent to {owner} at {email}". Empty city shows "—".

## Settings ("PLATFORM" / "Settings", button "Save Changes" → "Settings saved")
- Two columns gap 24, top-aligned.
- General: Platform name; 2×2 grid gap 16: Support email, Support phone, Free trial (days) (min 0), Invite expiry (days) (min 1).
- Email Notifications ("Sent to your admin email."): rows label + subtitle + switch (track 44×26 radius 999 padding 3; on cyan-400 knob right, off gray-300; knob 20 white with shadow): New company signs up ("When an invite is accepted", on), Trial ending ("3 days before a trial ends", on), Payment overdue ("When a company misses a payment", on), Weekly summary ("Every Monday morning", off).
- Plans: sub "Monthly price in KES and employee limit per plan. Leave the limit empty for unlimited." Columns `minmax(0,1fr) 200px 200px 140px`: Plan | Price / Month (KES) | Employee Limit (min 1, placeholder "Unlimited") | Companies (count). Defaults Starter 1500/6, Growth 3500/12, Pro 6500/unlimited.
- Fields, toggles and plan edits persist only on Save Changes.

## Profile ("ACCOUNT" / "Profile")
- Two columns gap 24. Your Details: header navy avatar + "Your Details" / "Platform Admin"; Full name, Email, Phone; "Save Details" disabled until changed and valid → "Profile updated" (sidebar chip updates).
- Change Password: sub "At least 8 characters."; Current / New / Confirm ("Passwords don't match." under Confirm); "Update Password" disabled unless current filled, new ≥ 8 and matching → "Password updated".

## Behaviour mapped to the app
- Accepting a company invite starts a trial (`trialEndsAt = now + trialDays`).
- Suspending signs out every user of that salon and blocks sign-in ("This salon's account is suspended."). Reactivate restores it.
- Revoke only while invited; Delete only while suspended (removes all data and receipts).
- Reset Owner Password issues a 1-hour single-use link to `/reset-password`.
- A plan's employee limit is enforced when adding or reactivating employees.
