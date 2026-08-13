"use server";

import { createClient } from "@/lib/supabase/server";

export async function createLead(agentId: string, propertyId: string | null, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("leads").insert({
    agent_id: agentId,
    property_id: propertyId,
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    message: String(formData.get("message") ?? ""),
    source: "profile",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  await supabase.from("analytics_events").insert({
    agent_id: agentId,
    type: "click",
    meta: { kind: "lead_submitted" },
  });

  return { ok: true, message: "¡Gracias! Te contactaremos pronto." };
}

export async function logProfileView(agentId: string) {
  const supabase = await createClient();
  await supabase.from("analytics_events").insert({ agent_id: agentId, type: "view" });
}
