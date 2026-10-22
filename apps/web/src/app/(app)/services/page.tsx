import { ActionLabel, PageBody, PageHeader } from "@/components/shell/page";
import { Card, CardHeader, EmptyState, ModalLink, buttonClass } from "@/components/ui";
import { api, unwrap } from "@/lib/api";
import { plural } from "@/lib/format";
import { AddServiceModal } from "./add-service-modal";
import { ServiceRow } from "./service-row";

export default async function ServicesPage() {
  const client = await api();
  const services = await unwrap(await client.services.$get());

  return (
    <>
      <PageHeader
        title="Services"
        action={
          <ModalLink id="add-service" className={buttonClass("primary")}>
            <ActionLabel label="Add Service" short="+ Add" />
          </ModalLink>
        }
      />
      <PageBody>
        <Card>
          <CardHeader title="Service Menu" caption={plural(services.length, "service")} />
          {services.length === 0 ? (
            <EmptyState>No services yet. Add your first one.</EmptyState>
          ) : (
            <ul>
              {services.map((s) => (
                <ServiceRow
                  // Remount after a save so fields reset to what the server stored.
                  key={`${s.id}:${s.modifiedDate}`}
                  service={s}
                />
              ))}
            </ul>
          )}
        </Card>
      </PageBody>
      <AddServiceModal />
    </>
  );
}
