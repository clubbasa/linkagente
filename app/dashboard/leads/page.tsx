import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionAgent } from "@/lib/firebase/session";
import { docToLead } from "@/lib/firebase/leads";
import { LeadRow } from "./lead-row";

export default async function LeadsPage() {
  const session = await getSessionAgent();
  if (!session) redirect("/login");
  const { uid } = session;

  const [leadsSnap, catalogSnap] = await Promise.all([
    adminDb.collection("agents").doc(uid).collection("leads").orderBy("createdAt", "desc").get(),
    adminDb.collection("agents").doc(uid).collection("catalogItems").get(),
  ]);

  const leads = leadsSnap.docs.map((doc) => docToLead(uid, doc.id, doc.data()));
  const itemTitles = new Map(catalogSnap.docs.map((doc) => [doc.id, doc.data().title as string]));

  const newCount = leads.filter((lead) => lead.status === "new").length;
  const contactedCount = leads.filter((lead) => lead.status === "contacted").length;
  const closedCount = leads.filter((lead) => lead.status === "closed").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Leads capturados</h1>
        <div className="flex gap-4 text-xs text-zinc-500">
          <span>
            <strong className="text-zinc-900">{newCount}</strong> nuevos
          </span>
          <span>
            <strong className="text-zinc-900">{contactedCount}</strong> contactados
          </span>
          <span>
            <strong className="text-zinc-900">{closedCount}</strong> cerrados
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {leads.map((lead) => (
          <LeadRow
            key={lead.id}
            lead={lead}
            itemTitle={lead.property_id ? itemTitles.get(lead.property_id) ?? null : null}
          />
        ))}
        {!leads.length && (
          <p className="px-4 py-6 text-sm text-zinc-500">
            Todavía no tienes leads. Comparte tu link público para empezar a recibirlos.
          </p>
        )}
      </div>
    </div>
  );
}
