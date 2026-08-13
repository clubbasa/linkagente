import { redirect } from "next/navigation";
import { getSessionAgent } from "@/lib/firebase/session";
import { getVerticalConfig } from "@/lib/verticals";
import { createCatalogItem } from "../actions";
import { CatalogItemForm } from "../catalog-item-form";

export default async function NewCatalogItemPage() {
  const session = await getSessionAgent();
  if (!session) redirect("/login");
  const vertical = getVerticalConfig(session.agent.vertical);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h1 className="text-lg font-semibold text-zinc-900">{vertical.newItemLabel}</h1>
      <div className="mt-4">
        <CatalogItemForm vertical={vertical} action={createCatalogItem} />
      </div>
    </div>
  );
}
