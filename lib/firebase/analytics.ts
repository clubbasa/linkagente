import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { AnalyticsEventKind } from "@/lib/types";

// Función simple (no "use server") a propósito: se llama tanto desde
// Server Actions (app/[slug]/actions.ts, invocadas desde el cliente) como
// directo durante el render de un Server Component (logProfileView, más
// abajo). Llamar una función "use server" directo durante el render — en
// vez de como acción de un <form>/cliente — rompe el bundling de
// firebase-admin en Vercel (ERR_REQUIRE_ESM de jose/jwks-rsa), así que la
// lógica compartida vive aquí, en un módulo plano.
export async function recordAnalyticsEvent(
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

// Se llama directo desde app/[slug]/page.tsx durante el render (no es una
// Server Action) — ver la nota arriba sobre por qué no puede vivir en
// actions.ts.
export async function logProfileView(agentUid: string) {
  await recordAnalyticsEvent(agentUid, "view", "profile_view");
}

export interface AnalyticsSummary {
  totalViews: number;
  totalLeads: number;
  clicksByKind: Record<string, number>;
  viewsByDay: { date: string; count: number }[];
  rangeDays: number;
}

// Agrega los eventos de agents/{uid}/analyticsEvents de los últimos
// `rangeDays` días. Los eventos son pocos por agente (SaaS chico), así que
// se agregan en memoria en vez de necesitar consultas compuestas en
// Firestore. Soporta el esquema viejo (meta.kind) y el nuevo (kind plano)
// por si quedan eventos de antes de este cambio.
export async function getAnalyticsSummary(uid: string, rangeDays = 14): Promise<AnalyticsSummary> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (rangeDays - 1));
  const sinceIso = since.toISOString();

  const snap = await adminDb
    .collection("agents")
    .doc(uid)
    .collection("analyticsEvents")
    .where("createdAt", ">=", sinceIso)
    .get();

  const dayBuckets = new Map<string, number>();
  for (let i = 0; i < rangeDays; i++) {
    const day = new Date(since);
    day.setDate(day.getDate() + i);
    dayBuckets.set(day.toISOString().slice(0, 10), 0);
  }

  let totalViews = 0;
  let totalLeads = 0;
  const clicksByKind: Record<string, number> = {};

  snap.docs.forEach((doc) => {
    const data = doc.data();
    const kind: string =
      data.kind ?? data.meta?.kind ?? (data.type === "view" ? "profile_view" : "click");
    const day = String(data.createdAt ?? "").slice(0, 10);

    if (kind === "profile_view") {
      totalViews += 1;
      if (dayBuckets.has(day)) dayBuckets.set(day, (dayBuckets.get(day) ?? 0) + 1);
    } else if (kind === "lead_submitted") {
      totalLeads += 1;
    } else {
      clicksByKind[kind] = (clicksByKind[kind] ?? 0) + 1;
    }
  });

  const viewsByDay = Array.from(dayBuckets.entries()).map(([date, count]) => ({ date, count }));

  return { totalViews, totalLeads, clicksByKind, viewsByDay, rangeDays };
}
