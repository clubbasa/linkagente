import type { CatalogItem } from "@/lib/types";

// Convierte un documento de Firestore (agents/{uid}/catalogItems/{id}) al
// tipo CatalogItem. Se usa tanto en el dashboard del agente como en el
// perfil público.
export function docToCatalogItem(
  agentUid: string,
  id: string,
  data: FirebaseFirestore.DocumentData
): CatalogItem {
  return {
    id,
    agent_id: agentUid,
    title: data.title ?? "",
    price: data.price ?? null,
    currency: data.currency ?? "MXN",
    status: data.status ?? "for_sale",
    photo_url: data.photoUrl ?? null,
    description: data.description ?? null,
    extra_fields: data.extraFields ?? {},
    created_at: data.createdAt ?? new Date().toISOString(),
  };
}
