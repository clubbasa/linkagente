import { adminDb } from "@/lib/firebase/admin";
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

// Búsqueda pública (sin sesión) del nombre de una organización, para
// mostrar "Te unes a la red de X" en /signup?org={id}. Función plana (no
// "use server") a propósito, para poder llamarla directo desde el render
// de app/signup/page.tsx — ver la nota en lib/firebase/analytics.ts sobre
// por qué eso no puede vivir en un archivo "use server".
export async function getOrganizationName(organizationId: string): Promise<string | null> {
  const snap = await adminDb.collection("organizations").doc(organizationId).get();
  if (!snap.exists) return null;
  return (snap.data()?.name as string) ?? null;
}
