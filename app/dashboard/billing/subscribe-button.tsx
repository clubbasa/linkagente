"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { confirmSubscription } from "./actions";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: Record<string, unknown>) => { render: (selector: string) => void };
    };
  }
}

// Carga el SDK de JS de PayPal (misma URL sirve para sandbox y live — lo
// determina el client-id que se le pasa) y renderiza el botón de
// suscripción. Al aprobar, confirma el estado directo con la API de PayPal
// (ver actions.ts) para no depender de que el webhook ya esté configurado.
export function SubscribeButton({
  clientId,
  planId,
  uid,
}: {
  clientId: string;
  planId: string;
  uid: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Estado inicial calculado en el render (no en el efecto) para no llamar
  // setState de forma síncrona dentro de un efecto — si el SDK ya estaba
  // cargado (navegación previa dentro de la misma sesión), arranca en
  // "idle" directo; si no, arranca en "loading" mientras se inyecta el
  // script.
  const [status, setStatus] = useState<"idle" | "loading" | "confirming" | "error">(() =>
    typeof window !== "undefined" && window.paypal ? "idle" : "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    function renderButtons() {
      if (cancelled || !containerRef.current || !window.paypal) return;
      containerRef.current.innerHTML = "";
      window.paypal
        .Buttons({
          style: { shape: "pill", color: "black", layout: "vertical", label: "subscribe" },
          createSubscription: (_data: unknown, actions: {
            subscription: { create: (opts: Record<string, unknown>) => Promise<string> };
          }) => actions.subscription.create({ plan_id: planId, custom_id: uid }),
          onApprove: async (data: { subscriptionID: string }) => {
            setStatus("confirming");
            try {
              await confirmSubscription(data.subscriptionID);
              router.refresh();
            } catch {
              setErrorMessage(
                "Se aprobó en PayPal pero no pudimos confirmarlo aquí. Refresca la página en unos segundos."
              );
              setStatus("error");
            }
          },
          onError: () => {
            setErrorMessage("Hubo un problema con PayPal. Intenta de nuevo.");
            setStatus("error");
          },
        })
        .render("#paypal-subscribe-button");
    }

    if (window.paypal) {
      renderButtons();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(
      clientId
    )}&vault=true&intent=subscription&currency=MXN`;
    script.dataset.sdkIntegrationSource = "button-factory";
    script.onload = () => {
      setStatus("idle");
      renderButtons();
    };
    script.onerror = () => {
      setErrorMessage("No se pudo cargar PayPal. Revisa tu conexión e intenta de nuevo.");
      setStatus("error");
    };
    document.body.appendChild(script);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, planId, uid]);

  return (
    <div>
      <div id="paypal-subscribe-button" ref={containerRef} className="max-w-xs" />
      {status === "loading" && <p className="mt-2 text-sm text-zinc-500">Cargando PayPal…</p>}
      {status === "confirming" && (
        <p className="mt-2 text-sm text-zinc-500">Confirmando tu suscripción…</p>
      )}
      {status === "error" && <p className="mt-2 text-sm text-red-600">{errorMessage}</p>}
    </div>
  );
}
