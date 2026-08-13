import { notFound, redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionAgent } from "@/lib/firebase/session";
import type { Property } from "@/lib/types";
import { updateProperty } from "../actions";
import { PropertyForm } from "../property-form";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionAgent();
  if (!session) redirect("/login");
  const { uid } = session;

  const doc = await adminDb
    .collection("agents")
    .doc(uid)
    .collection("properties")
    .doc(id)
    .get();

  if (!doc.exists) notFound();
  const data = doc.data()!;

  const property: Property = {
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

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h1 className="text-lg font-semibold text-zinc-900">Editar propiedad</h1>
      <div className="mt-4">
        <PropertyForm property={property} action={updateProperty} />
      </div>
    </div>
  );
}
