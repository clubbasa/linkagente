"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { requireSessionUid } from "@/lib/firebase/session";
import { getSubscription, cancelSubscription, mapPaypalStatus } from "@/lib/paypal";

// Se llama desde el cliente justo después de que PayPal aprueba la
// suscripción (onApprove del botón), para reflejar el estado de inmediato
// en vez de esperar a que llegue el webhook. El webhook (ver
// app/api/paypal/webhook/route.ts) sigue siendo la fuente de verdad para
// cambios posteriores (cancelaciones, pagos fallidos, etc).
export async function confirmSubscription(subscriptionId: string) {
  const uid = await requireSessionUid();

  const subscription = await getSubscription(subscriptionId);

  // Nota de seguridad: esto solo escribe en el documento del agente de la
  // sesión actual (uid viene de la cookie httpOnly, no del cliente) — así
  // que aunque alguien mandara un subscriptionId ajeno, a lo mucho vería
  // el estado real de esa suscripción, pero nunca podría modificar el
  // documento de otro agente.
  await adminDb.collection("agents").doc(uid).set(
    {
      subscriptionStatus: mapPaypalStatus(subscription.status),
      subscriptionId: subscription.id,
      subscriptionUpdatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  revalidatePath("/dashboard/billing");
}

export async function cancelMySubscription() {
  const uid = await requireSessionUid();
  const agentRef = adminDb.collection("agents").doc(uid);
  const agentSnap = await agentRef.get();
  const subscriptionId = agentSnap.data()?.subscriptionId as string | undefined;

  if (subscriptionId) {
    await cancelSubscription(subscriptionId, "Cancelado por el agente desde su panel.");
  }

  await agentRef.set(
    { subscriptionStatus: "cancelled", subscriptionUpdatedAt: new Date().toISOString() },
    { merge: true }
  );

  revalidatePath("/dashboard/billing");
  redirect("/dashboard/billing?cancelled=1");
}
