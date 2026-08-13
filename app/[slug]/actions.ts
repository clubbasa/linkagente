"use server";

import { adminDb } from "@/lib/firebase/admin";
import type { AnalyticsEventKind } from "@/lib/types";

async function addAnalyticsEvent(
  agentUid: string,
  type: "view" | "click",
  kind: AnalyticsEventKind,
  platform?: string | null
) {
  await adminDb
    .collection("agents")
    .doc(agentUid)
    .collection("analyticsEvents")
    .add({
      type,
      kind,
      platform: platform ?? null,
      createdAt: new Date().toISOString(),
    });
}

export async function createLead(agentUid: string, propertyId: string | null, formData: FormData) {
  try {
    await adminDb
      .collection("agents")
      .doc(agentUid)
      .collection("leads")
      .add({
        propertyId,
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        message: String(formData.get("message") ?? ""),
        status: "new",
        source: "profile",
        notes: "",
        createdAt: new Date().toISOString(),
      });

    await addAnalyticsEvent(agentUid, "click", "lead_submitted");

    return { ok: true, message: "¡Gracias! Te contactaremos pronto." };
  } catch {
    return { ok: false, message: "No se pudo enviar. Inténtalo de nuevo." };
  }
}

export async function logProfileView(agentUid: string) {
  await addAnalyticsEvent(agentUid, "view", "profile_view");
}

// Se llama desde los links del perfil público (teléfono, correo, WhatsApp,
// guardar contacto, redes sociales) vía <TrackedLink>. No bloquea la
// navegación: el link funciona igual aunque esto falle.
export async function logClickEvent(
  agentUid: string,
  kind: Exclude<AnalyticsEventKind, "profile_view" | "lead_submitted">,
  platform?: string
) {
  try {
    await addAnalyticsEvent(agentUid, "click", kind, platform ?? null);
  } catch {
    // No pasa nada si falla el registro — nunca debe romper la navegación.
  }
}
