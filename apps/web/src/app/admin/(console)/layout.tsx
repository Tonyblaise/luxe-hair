import { Suspense } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { adminApi, adminUnwrap } from "@/lib/admin";
import { AdminShell } from "./admin-shell";

export default async function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  const client = await adminApi();
  const me = await adminUnwrap(await client.me.$get());

  return (
    <ToastProvider>
      <Suspense>
        <AdminShell name={me.name} email={me.email}>
          {children}
        </AdminShell>
      </Suspense>
    </ToastProvider>
  );
}
