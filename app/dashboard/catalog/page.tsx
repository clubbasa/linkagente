import Link from "next/link";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionAgent } from "@/lib/firebase/session";
import { docToCatalogItem } from "@/lib/firebase/catalog";
import { getVerticalConfig } from "@/lib/verticals";
import { deleteCatalogItem } from "./actions";

export default async function CatalogPage() {
  const session = await getSessionAgent();
  if (!session) redirect("/login");
  const { uid, agent } = session;
  const vertical = getVerticalConfig(agent.vertical);

  const snap = await adminDb
    .collection("agents")
    .doc(uid)
    .collection("catalogItems")
    .orderBy("createdAt", "desc")
    .get();

  const items = snap.docs.map((doc) => docToCatalogItem(uid, doc.id, doc.data()));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">{vertical.catalogLabel}</h1>
        <Link
          href="/dashboard/catalog/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + {vertical.newItemLabel}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                  {vertical.statusLabels[item.status]}
                </span>
                <h3 className="mt-2 font-medium text-zinc-900">{item.title}</h3>
                {vertical.extraFields.map((field) =>
                  item.extra_fields[field.key] ? (
                    <p key={field.key} className="text-sm text-zinc-500">
                      {item.extra_fields[field.key]}
                    </p>
                  ) : null
                )}
                {item.price && (
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {item.currency} ${item.price.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-3 text-sm">
              <Link
                href={`/dashboard/catalog/${item.id}`}
                className="font-medium text-zinc-900 underline"
              >
                Editar
              </Link>
              <form action={deleteCatalogItem}>
                <input type="hidden" name="id" value={item.id} />
                <button className="font-medium text-red-600 hover:underline">Eliminar</button>
              </form>
            </div>
          </div>
        ))}
        {!items.length && (
          <p className="text-sm text-zinc-500">
            Todavía no agregas nada a tu {vertical.catalogLabel.toLowerCase()}. Crea el primero con el
            botón de arriba.
          </p>
        )}
      </div>
    </div>
  );
}
