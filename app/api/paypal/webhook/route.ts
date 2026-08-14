import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyWebhookSignature, mapPaypalStatus } from "@/lib/paypal";

// PayPal manda aquí un POST cada vez que cambia el estado de una
// suscripción (activada, cancelada, suspendida por pago fallido, etc).
// Configúralo en developer.paypal.com → tu app → Add Webhook, apuntando a
// https://tu-dominio/api/paypal/webhook, suscrito a los eventos
// "Billing subscription *". El PAYPAL_WEBHOOK_ID que te den ahí va en las
// variables de entorno.
//
// El uid del agente viaja en `resource.custom_id` — se manda al crear la
// suscripción desde el cliente (ver app/dashboard/billing/subscribe-button.tsx)
// para no depender de haber guardado antes el subscription_id.
export async function POST(request: Request) {
  const rawBody = await request.text();

  let verified = false;
  try {
    verified = await verifyWebhookSignature(request.headers, rawBody);
  } catch (error) {
    console.error("Error verificando webhook de PayPal:", error);
    return NextResponse.json({ error: "verification_failed" }, { status: 400 });
  }

  if (!verified) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventType = String(event.event_type ?? "");

  if (!eventType.startsWith("BILLING.SUBSCRIPTION.")) {
    // No es un evento de suscripción (ej. eventos de pagos sueltos) — lo
    // reconocemos pero no hay nada que actualizar todavía.
    return NextResponse.json({ ok: true, ignored: eventType });
  }

  const resource = event.resource ?? {};
  const uid = resource.custom_id as string | undefined;
  const paypalStatus = resource.status as string | undefined;
  const subscriptionId = resource.id as string | undefined;

  if (!uid || !paypalStatus) {
    return NextResponse.json({ ok: true, ignored: "missing_custom_id_or_status" });
  }

  await adminDb.collection("agents").doc(uid).set(
    {
      subscriptionStatus: mapPaypalStatus(paypalStatus),
      subscriptionId: subscriptionId ?? null,
      subscriptionUpdatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
