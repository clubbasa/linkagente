import Link from "next/link";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionAgent } from "@/lib/firebase/session";
import type { Property } from "@/lib/types";
import { deleteProperty } from "./actions";

const statusLabel: Record<Property["status"], string> = {
  featured: "Destacada",
  for_sale: "En venta",
  sold: "Vendida",
};

export default async function PropertiesPage() {
  const session = await getSessionAgent();
  if (!session) redirect("/login");
  const { uid } = session;

  const snap = await adminDb
    .collection("agents")
    .doc(uid)
    .collection("properties")
    .orderBy("createdAt", "desc")
    .get();

  const properties: Property[] = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      agent_id: uid,
      title: data.title,
      address: data.address ?? null,
      price: data.price ?? null,
      currency: data.currency ?? "USD",
      status: data.status,
      photo_url: data.photoUrl ?? null,
      description: data.description ?? null,
      created_at: data.createdAt,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Propiedades</h1>
        <Link
          href="/dashboard/properties/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + Nueva propiedad
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {properties.map((property) => (
          <div key={property.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                  {statusLabel[property.status]}
                </span>
                <h3 className="mt-2 font-medium text-zinc-900">{property.title}</h3>
                <p className="text-sm text-zinc-500">{property.address}</p>
                {property.price && (
                  <p className="mt-1 text-sm font-semibold text-zinc-900">
                    {property.currency} ${property.price.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-3 text-sm">
              <Link
                href={`/dashboard/properties/${property.id}`}
                className="font-medium text-zinc-900 underline"
              >
                Editar
              </Link>
              <form action={deleteProperty}>
                <input type="hidden" name="id" value={property.id} />
                <button className="font-medium text-red-600 hover:underline">Eliminar</button>
              </form>
            </div>
          </div>
        ))}
        {!properties.length && (
          <p className="text-sm text-zinc-500">
            Todavía no agregas propiedades. Crea la primera con el botón de arriba.
          </p>
        )}
      </div>
    </div>
  );
}
