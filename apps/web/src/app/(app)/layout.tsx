import { Shell } from "@/components/shell/shell";
import { ToastProvider } from "@/components/ui/toast";
import { api, unwrapAll } from "@/lib/api";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const client = await api();
  const [me, counts] = await unwrapAll(client.auth.me.$get(), client.meta["nav-counts"].$get());
  const userName = [me.firstName, me.lastName].filter(Boolean).join(" ") || me.email;

  return (
    <ToastProvider>
      <Shell companyName={me.company.name} userName={userName} counts={counts}>
        {children}
      </Shell>
    </ToastProvider>
  );
}
