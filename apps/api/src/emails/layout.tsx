import type { ReactNode } from "react";
import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "react-email";

// Design tokens from apps/web/src/app/globals.css (email clients can't read CSS variables).
const color = {
  navy800: "#1e2b6b",
  navy700: "#2a3a85",
  cyan400: "#4fc3f7",
  yellow400: "#f4cb45",
  offwhite: "#eef1f2",
  gray200: "#e1e5eb",
  gray500: "#7c8694",
  gray600: "#525c6b",
};

const font = 'Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

export type BrandProps = {
  /** PlatformSettings.platformName. */
  platformName: string;
  /** PlatformSettings.supportEmail; the footer leaves it out when empty. */
  supportEmail: string;
};

type LayoutProps = BrandProps & {
  preview: string;
  heading: string;
  /** Call to action; its URL is repeated as text for clients that drop buttons. */
  action: { label: string; url: string };
  /** Small print under the button, e.g. when the link expires. */
  note: string;
  children: ReactNode;
};

export function EmailLayout({ platformName, supportEmail, preview, heading, action, note, children }: LayoutProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, backgroundColor: color.offwhite, fontFamily: font, color: color.navy800 }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "32px 16px" }}>
          <Section style={{ backgroundColor: color.navy800, borderRadius: "12px 12px 0 0", padding: "20px 32px" }}>
            <Text style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#ffffff" }}>
              <span style={{ color: color.yellow400 }}>⚡</span> {platformName}
            </Text>
          </Section>
          <Section style={{ backgroundColor: "#ffffff", borderRadius: "0 0 12px 12px", padding: "32px" }}>
            <Heading as="h1" style={{ margin: "0 0 16px", fontSize: 22, lineHeight: "28px", fontWeight: 600 }}>
              {heading}
            </Heading>
            {children}
            <Button
              href={action.url}
              style={{
                display: "inline-block",
                margin: "8px 0 16px",
                padding: "14px 24px",
                borderRadius: 10,
                backgroundColor: color.navy700,
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {action.label}
            </Button>
            <Text style={{ margin: "0 0 16px", fontSize: 13, lineHeight: "20px", color: color.gray600 }}>{note}</Text>
            <Hr style={{ borderColor: color.gray200, margin: "16px 0" }} />
            <Text style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: color.gray500 }}>
              Button not working? Paste this link into your browser:
              <br />
              <Link href={action.url} style={{ color: color.navy700, wordBreak: "break-all" }}>
                {action.url}
              </Link>
            </Text>
          </Section>
          <Text style={{ margin: "16px 0 0", fontSize: 12, lineHeight: "18px", color: color.gray500, textAlign: "center" }}>
            {supportEmail ? (
              <>
                Questions? Contact{" "}
                <Link href={`mailto:${supportEmail}`} style={{ color: color.gray600 }}>
                  {supportEmail}
                </Link>
                .{" "}
              </>
            ) : null}
            If you weren&apos;t expecting this email, you can ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

/** Body paragraph styled for the layout. */
export function Paragraph({ children }: { children: ReactNode }) {
  return <Text style={{ margin: "0 0 16px", fontSize: 15, lineHeight: "24px", color: color.navy800 }}>{children}</Text>;
}

/** "Halo Beauty on Luxe Hair", or just the salon's name when it is the platform's own name. */
export const onPlatform = (company: string, platformName: string) =>
  company === platformName ? company : `${company} on ${platformName}`;

export const previewBrand: BrandProps = { platformName: "Luxe Hair", supportEmail: "support@salonmanager.co.ke" };

export { color as emailColors };
