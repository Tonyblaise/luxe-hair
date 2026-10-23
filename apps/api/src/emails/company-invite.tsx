import { EmailLayout, Paragraph, onPlatform, previewBrand, type BrandProps } from "./layout";

export type CompanyInviteEmailProps = BrandProps & {
  firstName: string;
  company: string;
  days: number;
  url: string;
};

export default function CompanyInviteEmail({ firstName, company, days, url, ...brand }: CompanyInviteEmailProps) {
  return (
    <EmailLayout
      {...brand}
      preview={`Set up ${onPlatform(company, brand.platformName)}`}
      heading={`Set up ${onPlatform(company, brand.platformName)}`}
      action={{ label: "Set up your salon", url }}
      note={`This invite expires in ${days} days. Your free trial starts when you accept it.`}
    >
      <Paragraph>Hi {firstName},</Paragraph>
      <Paragraph>
        You&apos;ve been invited to run {onPlatform(company, brand.platformName)}: sales, appointments, payouts, expenses and
        reports in one place. Accept the invite to set your password and open your salon&apos;s account.
      </Paragraph>
    </EmailLayout>
  );
}

CompanyInviteEmail.PreviewProps = {
  ...previewBrand,
  firstName: "Wanjiku",
  company: "Halo Beauty Lounge",
  days: 7,
  url: "http://localhost:3000/accept-invite?token=preview",
} satisfies CompanyInviteEmailProps;
