import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/types";
import { LeadStatusSelect } from "./status-select";

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("agent_id", agent?.id ?? "")
    .order("created_at", { ascending: false })
    .returns<Lead[]>();

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
            {leads?.map((lead) => (
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
        {!leads?.length && (
          <p className="px-4 py-6 text-sm text-zinc-500">
            Todavía no tienes leads. Comparte tu link público para empezar a recibirlos.
          </p>
        )}
      </div>
    </div>
  );
}
