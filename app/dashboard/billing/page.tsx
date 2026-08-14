import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionAgent } from "@/lib/firebase/session";
import { paysDirectly, SUBSCRIPTION_PRICE_MXN } from "@/lib/billing";
import { SubscribeButton } from "./subscribe-button";
import { cancelMySubscription } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  none: "Sin suscripción",
  approval_pending: "Pendiente de aprobación",
  active: "Activa",
  suspended: "Suspendida (pago fallido)",
  cancelled: "Cancelada",
  expired: "Expirada",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const { cancelled } = await searchParams;
  const session = await getSessionAgent();
  if (!session) redirect("/login");
  const { agent } = session;

  // Los agentes que pertenecen a la red de un distribuidor no pagan
  // directo — su acceso lo cubre la suscripción del distribuidor (ver
  // lib/billing.ts).
  if (!paysDirectly(agent)) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-lg font-semibold text-zinc-900">Facturación</h1>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-600">
            Tu acceso está cubierto por la suscripción de tu red de distribuidor — no necesitas
            pagar nada directo a la plataforma.
          </p>
        </div>
      </div>
    );
  }

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const planId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID;
  const status = agent.subscription_status;
  const isActive = status === "active";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-zinc-900">Facturación</h1>

      {cancelled && (
        <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
          Tu suscripción fue cancelada. Puedes volver a suscribirte cuando quieras.
        </p>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-500">Estado de tu suscripción</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">
              {STATUS_LABELS[status] ?? status}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              isActive ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            ${SUBSCRIPTION_PRICE_MXN} MXN / mes
          </span>
        </div>

        <div className="mt-6">
          {isActive ? (
            <form action={cancelMySubscription}>
              <button
                type="submit"
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Cancelar suscripción
              </button>
            </form>
          ) : clientId && planId ? (
            <SubscribeButton clientId={clientId} planId={planId} uid={agent.id} />
          ) : (
            <p className="text-sm text-zinc-500">
              Los cobros todavía se están configurando — vuelve en un momento.
            </p>
          )}
        </div>
      </div>

      <Link href="/dashboard" className="text-sm text-zinc-500 underline hover:text-zinc-700">
        Volver a mi perfil
      </Link>
    </div>
  );
}
