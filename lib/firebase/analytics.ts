import "server-only";
import { adminDb } from "@/lib/firebase/admin";

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
