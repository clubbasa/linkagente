import type { Lead } from "@/lib/types";

// Convierte un documento de Firestore (agents/{uid}/leads/{id}) al tipo Lead.
export function docToLead(agentUid: string, id: string, data: FirebaseFirestore.DocumentData): Lead {
  return {
    id,
    agent_id: agentUid,
    property_id: data.propertyId ?? null,
    name: data.name ?? "",
    email: data.email ?? null,
    phone: data.phone ?? null,
    message: data.message ?? null,
    status: data.status ?? "new",
    source: data.source ?? "profile",
    notes: data.notes ?? null,
    created_at: data.createdAt ?? new Date().toISOString(),
  };
}
