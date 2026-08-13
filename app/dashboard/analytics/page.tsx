import { redirect } from "next/navigation";
import { getSessionAgent } from "@/lib/firebase/session";
import { getAnalyticsSummary } from "@/lib/firebase/analytics";

const KIND_LABELS: Record<string, string> = {
  phone_click: "Llamadas",
  email_click: "Correos",
  whatsapp_click: "WhatsApp",
  vcard_download: "Contactos guardados",
  social_click: "Clicks en redes sociales",
};

const DAY_LABEL_FORMAT = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });

export default async function AnalyticsPage() {
  const session = await getSessionAgent();
  if (!session) redirect("/login");

  const summary = await getAnalyticsSummary(session.uid, 14);
  const totalClicks = Object.values(summary.clicksByKind).reduce((sum, n) => sum + n, 0);
  const conversionRate =
    summary.totalViews > 0 ? Math.round((summary.totalLeads / summary.totalViews) * 100) : 0;
  const maxDayCount = Math.max(1, ...summary.viewsByDay.map((d) => d.count));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-zinc-900">Analítica (últimos {summary.rangeDays} días)</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Vistas al perfil" value={summary.totalViews} />
        <StatCard label="Leads recibidos" value={summary.totalLeads} />
        <StatCard label="Tasa de conversión" value={`${conversionRate}%`} hint="leads / vistas" />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Vistas por día
        </h2>
        {summary.totalViews === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            Todavía no hay vistas registradas en este periodo.
          </p>
        ) : (
          <div className="mt-6 flex h-40 items-end gap-2">
            {summary.viewsByDay.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-zinc-900"
                  style={{ height: `${Math.max(4, (day.count / maxDayCount) * 100)}%` }}
                  title={`${day.count} vistas`}
                />
                <span className="text-[10px] text-zinc-400">
                  {DAY_LABEL_FORMAT.format(new Date(`${day.date}T00:00:00`))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Clicks por tipo
        </h2>
        {totalClicks === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            Todavía no hay clicks registrados en este periodo.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {Object.entries(summary.clicksByKind)
              .sort(([, a], [, b]) => b - a)
              .map(([kind, count]) => (
                <li key={kind} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 text-sm text-zinc-600">
                    {KIND_LABELS[kind] ?? kind}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-zinc-900"
                      style={{ width: `${Math.max(4, (count / totalClicks) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-sm font-medium text-zinc-900">
                    {count}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}
