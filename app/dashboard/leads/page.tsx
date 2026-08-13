import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionAgent } from "@/lib/firebase/session";
import type { Lead } from "@/lib/types";
import { LeadStatusSelect } from "./status-select";

export default async function LeadsPage() {
  const session = await getSessionAgent();
  if (!session) redirect("/login");
  const { uid } = session;

  const snap = await adminDb
    .collection("agents")
    .doc(uid)
    .collection("leads")
    .orderBy("createdAt", "desc")
    .get();

  const leads: Lead[] = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      agent_id: uid,
      property_id: data.propertyId ?? null,
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      message: data.message ?? null,
      status: data.status ?? "new",
      source: data.source ?? "profile",
      created_at: data.createdAt,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-zinc-900">Leads capturados</h1>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Mensaje</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-zinc-100">
                <td className="px-4 py-3 font-medium text-zinc-900">{lead.name}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {lead.email}
                  {lead.email && lead.phone && " · "}
                  {lead.phone}
                </td>
                <td className="px-4 py-3 max-w-xs truncate text-zinc-600">{lead.message}</td>
                <td className="px-4 py-3 text-zinc-500">
                  {new Date(lead.created_at).toLocaleDateString("es-MX")}
                </td>
                <td className="px-4 py-3">
                  <LeadStatusSelect lead={lead} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!leads.length && (
          <p className="px-4 py-6 text-sm text-zinc-500">
            Todavía no tienes leads. Comparte tu link público para empezar a recibirlos.
          </p>
        )}
      </div>
    </div>
  );
}
