import type { Context } from "hono";
import { createElement, type ReactElement } from "react";
import { render } from "react-email";
import { Resend } from "resend";
import CompanyInviteEmail from "../emails/company-invite";
import { onPlatform, type BrandProps } from "../emails/layout";
import ResetPasswordEmail from "../emails/reset-password";
import TeamInviteEmail from "../emails/team-invite";
import { env } from "../env";

export type Email = {
  to: string;
  subject: string;
  react: ReactElement;
  /** The link the email carries, logged in development when there's no API key. */
  link: string;
};

/**
 * Sends one email through Resend. Never throws: a mail outage must not undo the invite or reset that
 * asked for it, and callers fall back to showing the link. Returns whether Resend accepted it.
 */
export async function sendEmail({ to, subject, react, link }: Email): Promise<boolean> {
  const apiKey = env.resendApiKey;
  if (!apiKey) {
    // No email service configured: the link only reaches the console, and never in production.
    if (process.env.NODE_ENV !== "production") console.log(`[email] ${to} · ${subject}: ${link}`);
    return false;
  }
  try {
    const [html, text] = await Promise.all([render(react), render(react, { plainText: true })]);
    // Built per call: module top-level work counts against Worker start-up CPU.
    const { error } = await new Resend(apiKey).emails.send({ from: env.emailFrom, to, subject, html, text });
    if (error) {
      console.error(`[email] Resend refused "${subject}" to ${to}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err);
    return false;
  }
}

/** Sends after the response (the Worker stays alive for it), so the reply's timing says nothing about the email. */
export function sendLater(c: Context, email: Email) {
  const sending = sendEmail(email);
  try {
    c.executionCtx.waitUntil(sending);
  } catch {
    // No ExecutionContext (outside the Worker runtime): the promise still runs on its own.
  }
}

/** Platform name and support email for the templates, from PlatformSettings. Read it inside the request. */
export const emailBrand = (settings: { platformName: string; supportEmail: string }): BrandProps => ({
  platformName: settings.platformName,
  supportEmail: settings.supportEmail,
});

const link = (path: string, token: string) => `${env.webOrigin}${path}?token=${encodeURIComponent(token)}`;

// The builders below only shape the message; pass the result to sendEmail.

/** Salon users reset at /reset-password; platform admins (no `company`) at /admin/reset. */
export function resetEmail(brand: BrandProps, to: string, token: string, opts: { firstName: string; company?: string }): Email {
  const url = link(opts.company ? "/reset-password" : "/admin/reset", token);
  return {
    to,
    subject: `Reset your ${brand.platformName} password`,
    react: createElement(ResetPasswordEmail, { ...brand, ...opts, url }),
    link: url,
  };
}

export function teamInviteEmail(
  brand: BrandProps,
  to: string,
  token: string,
  opts: { firstName: string; inviter: string; company: string; role: string; days: number },
): Email {
  const url = link("/accept-invite", token);
  return {
    to,
    subject: `${opts.inviter} invited you to join ${opts.company}`,
    react: createElement(TeamInviteEmail, { ...brand, ...opts, url }),
    link: url,
  };
}

export function companyInviteEmail(
  brand: BrandProps,
  to: string,
  token: string,
  opts: { firstName: string; company: string; days: number },
): Email {
  const url = link("/accept-invite", token);
  return {
    to,
    subject: `Set up ${onPlatform(opts.company, brand.platformName)}`,
    react: createElement(CompanyInviteEmail, { ...brand, ...opts, url }),
    link: url,
  };
}
