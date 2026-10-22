import { adminApi, adminUnwrap } from "@/lib/admin";
import { AdminBody, AdminPageHeader } from "../page-header";
import { DetailsCard, PasswordCard } from "./profile-forms";

export default async function AdminProfilePage() {
  const client = await adminApi();
  const me = await adminUnwrap(await client.me.$get());
  return (
    <AdminBody>
      <AdminPageHeader eyebrow="Account" title="Profile" />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <DetailsCard initial={{ name: me.name, email: me.email, phone: me.phone }} />
        <PasswordCard />
      </div>
    </AdminBody>
  );
}
