import "server-only";

// Cliente mínimo de la API REST de PayPal — solo lo que usa la app en
// tiempo de ejecución (consultar/cancelar una suscripción y verificar la
// firma de un webhook). La creación única del producto y el plan de
// facturación se hace aparte, con scripts/setup-paypal-plan.mjs — no vive
// aquí porque es un paso de configuración que se corre una sola vez, no
// código que la app necesite en cada request.
function getApiBase(): string {
  const env = process.env.PAYPAL_ENV === "live" ? "live" : "sandbox";
  return env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function getCredentials(): { clientId: string; secret: string } {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) {
    throw new Error(
      "Faltan variables de entorno de PayPal (NEXT_PUBLIC_PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)."
    );
  }
  return { clientId, secret };
}

async function getAccessToken(): Promise<string> {
  const { clientId, secret } = getCredentials();
  const res = await fetch(`${getApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`No se pudo obtener el token de PayPal (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

async function ppFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`PayPal API error en ${path} (${res.status}): ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json();
}

export interface PaypalSubscription {
  id: string;
  status: string; // APPROVAL_PENDING | APPROVED | ACTIVE | SUSPENDED | CANCELLED | EXPIRED
  subscriber?: { email_address?: string };
  billing_info?: { next_billing_time?: string };
}

export async function getSubscription(subscriptionId: string): Promise<PaypalSubscription> {
  return ppFetch(`/v1/billing/subscriptions/${subscriptionId}`);
}

export async function cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
  await ppFetch(`/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

// PayPal reporta el status en MAYÚSCULAS con snake distinto al nuestro —
// este mapeo lo normaliza al SubscriptionStatus de lib/types.ts.
export function mapPaypalStatus(paypalStatus: string): string {
  const map: Record<string, string> = {
    APPROVAL_PENDING: "approval_pending",
    APPROVED: "approval_pending",
    ACTIVE: "active",
    SUSPENDED: "suspended",
    CANCELLED: "cancelled",
    EXPIRED: "expired",
  };
  return map[paypalStatus] ?? "none";
}

// Verifica que un webhook recibido en app/api/paypal/webhook/route.ts
// realmente venga de PayPal (evita que cualquiera mande un POST falso
// activando suscripciones gratis). Requiere PAYPAL_WEBHOOK_ID — se obtiene
// al registrar el endpoint en developer.paypal.com → Apps & Credentials →
// tu app → Add Webhook.
export async function verifyWebhookSignature(
  headers: Headers,
  rawBody: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    throw new Error("Falta la variable de entorno PAYPAL_WEBHOOK_ID.");
  }

  const result = await ppFetch("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  });

  return result?.verification_status === "SUCCESS";
}
