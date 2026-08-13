"use server";

import { adminDb } from "@/lib/firebase/admin";
import { getVerticalConfig } from "@/lib/verticals";
import type { Vertical } from "@/lib/types";

// Crea el documento de agente en Firestore justo después del registro
// (equivalente al trigger `handle_new_user` que teníamos en Supabase).
// El slug temporal usa los primeros 8 caracteres del uid. El título por
// defecto depende del giro elegido — ver lib/verticals.ts.
//
// Si viene `organizationId` (link de invitación de un distribuidor,
// /signup?org={id}) se valida que la organización exista y el agente se
// suma a esa red — siempre con rol "agent", nunca "distributor_admin" vía
// invitación, para no dar de alta distribuidores por accidente.
export async function createAgentProfile({
  uid,
  email,
  fullName,
  vertical,
  organizationId,
}: {
  uid: string;
  email: string;
  fullName: string;
  vertical: Vertical;
  organizationId?: string | null;
}) {
  const slug = `agente-${uid.slice(0, 8)}`;
  const now = new Date().toISOString();
  const verticalConfig = getVerticalConfig(vertical);

  let validOrgId: string | null = null;
  if (organizationId) {
    const orgSnap = await adminDb.collection("organizations").doc(organizationId).get();
    if (orgSnap.exists) validOrgId = organizationId;
  }

  await adminDb.collection("agents").doc(uid).set({
    slug,
    fullName,
    title: verticalConfig.defaultTitle,
    bio: "",
    photoUrl: null,
    coverUrl: null,
    phone: null,
    email,
    whatsapp: null,
    brandColor: "#e11d48",
    plan: "free",
    organizationId: validOrgId,
    role: "agent",
    vertical: verticalConfig.id,
    createdAt: now,
    updatedAt: now,
  });

  // Reserva el slug para poder resolverlo desde la página pública sin tener
  // que escanear toda la colección de agentes.
  await adminDb.collection("slugs").doc(slug).set({ uid });
}
