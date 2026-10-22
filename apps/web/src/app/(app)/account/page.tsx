import { TEAM_ROLE_LABELS } from "@luxe-hair/shared";
import { PageBody, PageHeader } from "@/components/shell/page";
import { Avatar, Button, Card, CardHeader } from "@/components/ui";
import { api, unwrap } from "@/lib/api";
import { signOut, signOutEverywhere } from "./actions";
import { DetailsForm } from "./details-form";
import { PasswordForm } from "./password-form";

export default async function AccountPage() {
  const client = await api();
  const me = await unwrap(await client.auth.me.$get());
  const name = [me.firstName, me.lastName].filter(Boolean).join(" ") || me.email;
  const roleLabel = me.teamRole ? TEAM_ROLE_LABELS[me.teamRole] : "Member";

  return (
    <>
      <PageHeader title="Account Settings" />
      <PageBody narrow>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-[clamp(12px,3vw,24px)]">
          <Card>
            <div className="flex items-center gap-3">
              <Avatar name={name} size={52} tone="navy" />
              <div className="min-w-0">
                <h2 className="text-[20px] leading-tight font-semibold">Your Details</h2>
                <p className="truncate text-sm text-gray-600">
                  {roleLabel} · {me.company.name}
                </p>
              </div>
            </div>
            <DetailsForm
              roleLabel={roleLabel}
              initial={{ firstName: me.firstName ?? "", lastName: me.lastName ?? "", phone: me.phone ?? "", email: me.email }}
            />
          </Card>

          <div className="flex flex-col gap-[clamp(12px,3vw,24px)]">
            <Card>
              <div className="flex flex-col gap-1">
                <CardHeader title="Change Password" />
                <p className="text-sm text-gray-600">
                  You&apos;ll stay signed in on this device. Other devices will be signed out.
                </p>
              </div>
              <PasswordForm />
            </Card>

            <Card>
              <CardHeader title="Sign Out" />
              <div className="flex flex-wrap gap-3">
                <form action={signOut}>
                  <Button type="submit" variant="outline" size="lg">
                    Sign out
                  </Button>
                </form>
                <form action={signOutEverywhere}>
                  <Button type="submit" variant="navy" size="lg">
                    Sign out everywhere
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  );
}
