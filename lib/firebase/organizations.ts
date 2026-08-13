import type { Organization } from "@/lib/types";

// Convierte un documento de Firestore (organizations/{id}) al tipo Organization.
export function docToOrganization(id: string, data: FirebaseFirestore.DocumentData): Organization {
  return {
    id,
    name: data.name ?? "",
    slug: data.slug ?? "",
    owner_uid: data.ownerUid,
    logo_url: data.logoUrl ?? null,
    brand_color: data.brandColor ?? null,
    created_at: data.createdAt ?? new Date().toISOString(),
  };
}
