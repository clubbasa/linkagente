"use server";

import { adminDb } from "@/lib/firebase/admin";

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
        createdAt: new Date().toISOString(),
      });

    await adminDb
      .collection("agents")
      .doc(agentUid)
      .collection("analyticsEvents")
      .add({
        type: "click",
        meta: { kind: "lead_submitted" },
        createdAt: new Date().toISOString(),
      });

    return { ok: true, message: "¡Gracias! Te contactaremos pronto." };
  } catch {
    return { ok: false, message: "No se pudo enviar. Inténtalo de nuevo." };
  }
}

export async function logProfileView(agentUid: string) {
  await adminDb
    .collection("agents")
    .doc(agentUid)
    .collection("analyticsEvents")
    .add({ type: "view", createdAt: new Date().toISOString() });
}
