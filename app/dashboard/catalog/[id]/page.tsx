import { notFound, redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionAgent } from "@/lib/firebase/session";
import { docToCatalogItem } from "@/lib/firebase/catalog";
import { getVerticalConfig } from "@/lib/verticals";
import { updateCatalogItem } from "../actions";
import { CatalogItemForm } from "../catalog-item-form";

export default async function EditCatalogItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionAgent();
  if (!session) redirect("/login");
  const { uid, agent } = session;
  const vertical = getVerticalConfig(agent.vertical);

  const doc = await adminDb
    .collection("agents")
    .doc(uid)
    .collection("catalogItems")
    .doc(id)
    .get();

  if (!doc.exists) notFound();
  const item = docToCatalogItem(uid, doc.id, doc.data()!);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h1 className="text-lg font-semibold text-zinc-900">Editar {vertical.itemLabel.toLowerCase()}</h1>
      <div className="mt-4">
        <CatalogItemForm item={item} vertical={vertical} action={updateCatalogItem} />
      </div>
    </div>
  );
}
