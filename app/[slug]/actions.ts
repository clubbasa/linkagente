"use server";

import { adminDb } from "@/lib/firebase/admin";
import { recordAnalyticsEvent } from "@/lib/firebase/analytics";
import type { AnalyticsEventKind } from "@/lib/types";

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

    await recordAnalyticsEvent(agentUid, "click", "lead_submitted");

    return { ok: true, message: "¡Gracias! Te contactaremos pronto." };
  } catch {
    return { ok: false, message: "No se pudo enviar. Inténtalo de nuevo." };
  }
}

// Se llama desde los links del perfil público (teléfono, correo, WhatsApp,
// guardar contacto, redes sociales) vía <TrackedLink>, como Server Action
// invocada desde el cliente. No bloquea la navegación: el link funciona
// igual aunque esto falle.
export async function logClickEvent(
  agentUid: string,
  kind: Exclude<AnalyticsEventKind, "profile_view" | "lead_submitted">,
  platform?: string
) {
  try {
    await recordAnalyticsEvent(agentUid, "click", kind, platform ?? null);
  } catch {
    // No pasa nada si falla el registro — nunca debe romper la navegación.
  }
}
