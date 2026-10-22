import { adminApi, adminUnwrap } from "@/lib/admin";
import { AdminBody } from "../page-header";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  const client = await adminApi();
  const settings = await adminUnwrap(await client.settings.$get());
  return (
    <AdminBody>
      <SettingsForm key={JSON.stringify(settings)} initial={settings} />
    </AdminBody>
  );
}
