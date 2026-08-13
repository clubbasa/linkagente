"use server";

import { adminDb } from "@/lib/firebase/admin";

// Crea el documento de agente en Firestore justo después del registro
// (equivalente al trigger `handle_new_user` que teníamos en Supabase).
// El slug temporal usa los primeros 8 caracteres del uid.
export async function createAgentProfile({
  uid,
  email,
  fullName,
}: {
  uid: string;
  email: string;
  fullName: string;
}) {
  const slug = `agente-${uid.slice(0, 8)}`;
  const now = new Date().toISOString();

  await adminDb.collection("agents").doc(uid).set({
    slug,
    fullName,
    title: "Asesor Inmobiliario",
    bio: "",
    photoUrl: null,
    coverUrl: null,
    phone: null,
    email,
    whatsapp: null,
    brandColor: "#e11d48",
    plan: "free",
    organizationId: null,
    createdAt: now,
    updatedAt: now,
  });

  // Reserva el slug para poder resolverlo desde la página pública sin tener
  // que escanear toda la colección de agentes.
  await adminDb.collection("slugs").doc(slug).set({ uid });
}
