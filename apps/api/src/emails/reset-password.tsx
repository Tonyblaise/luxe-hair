import { EmailLayout, Paragraph, previewBrand, type BrandProps } from "./layout";

export type ResetPasswordEmailProps = BrandProps & {
  firstName: string;
  /** Salon name for salon users; omitted for platform admins. */
  company?: string;
  url: string;
};

export default function ResetPasswordEmail({ firstName, company, url, ...brand }: ResetPasswordEmailProps) {
  return (
    <EmailLayout
      {...brand}
      preview={`Reset your ${brand.platformName} password`}
      heading="Reset your password"
      action={{ label: "Set a new password", url }}
      note="This link expires in 1 hour and can be used once. Setting a new password signs you out on every other device."
    >
      <Paragraph>Hi {firstName},</Paragraph>
      <Paragraph>
        We got a request to reset the password for your {company
          ? `${company} account${company === brand.platformName ? "" : ` on ${brand.platformName}`}`
          : `${brand.platformName} admin account`}.
        Use the button below to choose a new one.
      </Paragraph>
    </EmailLayout>
  );
}

ResetPasswordEmail.PreviewProps = {
  ...previewBrand,
  firstName: "Wanjiku",
  company: "Luxe Hair",
  url: "http://localhost:3000/reset-password?token=preview",
} satisfies ResetPasswordEmailProps;
