import { EmailLayout, Paragraph, onPlatform, previewBrand, type BrandProps } from "./layout";

export type TeamInviteEmailProps = BrandProps & {
  firstName: string;
  /** Full name of the person who sent the invite. */
  inviter: string;
  company: string;
  /** Display label, e.g. "Front Desk". */
  role: string;
  days: number;
  url: string;
};

export default function TeamInviteEmail({ firstName, inviter, company, role, days, url, ...brand }: TeamInviteEmailProps) {
  return (
    <EmailLayout
      {...brand}
      preview={`${inviter} invited you to join ${company}`}
      heading={`Join ${onPlatform(company, brand.platformName)}`}
      action={{ label: "Accept invite", url }}
      note={`This invite expires in ${days} days. Once you set a password, the link stops working.`}
    >
      <Paragraph>Hi {firstName},</Paragraph>
      <Paragraph>
        {inviter} has invited you to {company} as <strong>{role}</strong>. Accept the invite to set your password and
        sign in.
      </Paragraph>
    </EmailLayout>
  );
}

TeamInviteEmail.PreviewProps = {
  ...previewBrand,
  firstName: "Achieng",
  inviter: "Wanjiku Kamau",
  company: "Luxe Hair",
  role: "Front Desk",
  days: 7,
  url: "http://localhost:3000/accept-invite?token=preview",
} satisfies TeamInviteEmailProps;
