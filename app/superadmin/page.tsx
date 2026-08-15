import Link from "next/link";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionAgent } from "@/lib/firebase/session";
import { VERTICALS } from "@/lib/verticals";
import { setAgentRole, setAgentSuspended } from "./actions";
import { RoleSelect } from "./role-select";

const ROLE_LABELS: Record<string, string> = {
  agent: "Agente",
  distributor_admin: "Distribuidor",
  super_admin: "Super admin",
};

// Panel para el dueño de la plataforma (role "super_admin"): vista de todas
// las organizaciones/distribuidores y todos los agentes, sin importar a qué
// red pertenezcan, con dos mutaciones (ver app/superadmin/actions.ts):
// cambiar el rol de un agente y suspender/reactivar su cuenta. Ninguna de
// las dos se puede aplicar sobre uno mismo, para no poder bloquearse por
// accidente.
//
// No hay flujo para AUTO-otorgarse "super_admin" (el primer super_admin se
// marca a mano en la consola de Firebase) — pero un super_admin ya
// autenticado sí puede promover a otro agente a super_admin desde aquí,
// como cualquier otra acción de este panel: queda gateada por el chequeo de
// rol en requireSuperAdmin(), no por el cliente.
export default async function SuperAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const session = await getSessionAgent();
  if (!session) redirect("/login");
  if (session.agent.role !== "super_admin") redirect("/dashboard");

  const [orgsSnap, agentsSnap] = await Promise.all([
    adminDb.collection("organizations").get(),
    adminDb.collection("agents").get(),
  ]);

  const agents = agentsSnap.docs
    .map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        fullName: String(data.fullName ?? ""),
        email: String(data.email ?? ""),
        vertical: String(data.vertical ?? ""),
        slug: String(data.slug ?? ""),
        role: String(data.role ?? "agent"),
        organizationId: (data.organizationId as string | null) ?? null,
        suspended: Boolean(data.suspended ?? false),
        createdAt: String(data.createdAt ?? ""),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const agentsByUid = new Map(agents.map((agent) => [agent.uid, agent]));

  const organizations = orgsSnap.docs
    .map((doc) => {
      const data = doc.data();
      const id = doc.id;
      const agentCount = agents.filter((agent) => agent.organizationId === id).length;
      const owner = agentsByUid.get(String(data.ownerUid ?? ""));
      return {
        id,
        name: String(data.name ?? ""),
        slug: String(data.slug ?? ""),
        ownerName: owner?.fullName || owner?.email || "—",
        agentCount,
        createdAt: String(data.createdAt ?? ""),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const independentAgents = agents.filter((agent) => !agent.organizationId);
  const distributorAdmins = agents.filter((agent) => agent.role === "distributor_admin");

  const stats = [
    { label: "Agentes totales", value: agents.length },
    { label: "Organizaciones", value: organizations.length },
    { label: "Distribuidores", value: distributorAdmins.length },
    { label: "Agentes independientes", value: independentAgents.length },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Panel super-admin</h1>
        <Link href="/dashboard" className="text-sm text-zinc-500 underline hover:text-zinc-700">
          Volver a mi perfil
        </Link>
      </div>

      {saved && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Cambio guardado correctamente.
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="text-2xl font-semibold text-zinc-900">{stat.value}</p>
            <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">
          Organizaciones / distribuidores ({organizations.length})
        </h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Dueño</th>
                <th className="px-4 py-3">Agentes en la red</th>
                <th className="px-4 py-3">Directorio público</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3 font-medium text-zinc-900">{org.name}</td>
                  <td className="px-4 py-3 text-zinc-600">{org.ownerName}</td>
                  <td className="px-4 py-3 text-zinc-600">{org.agentCount}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/d/${org.slug}`}
                      target="_blank"
                      className="text-zinc-900 underline"
                    >
                      /d/{org.slug}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!organizations.length && (
            <p className="px-4 py-6 text-sm text-zinc-500">
              Todavía no hay ninguna organización/distribuidor dado de alta.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Todos los agentes ({agents.length})</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Giro</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Red</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Perfil público</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => {
                const org = agent.organizationId
                  ? organizations.find((candidate) => candidate.id === agent.organizationId)
                  : null;
                const isSelf = agent.uid === session.uid;
                return (
                  <tr key={agent.uid} className="border-t border-zinc-100">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {agent.fullName}
                      {isSelf && <span className="ml-1 text-xs text-zinc-400">(tú)</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{agent.email}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {VERTICALS[agent.vertical as keyof typeof VERTICALS]?.label ?? agent.vertical}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {isSelf ? (
                        ROLE_LABELS[agent.role] ?? agent.role
                      ) : (
                        <RoleSelect uid={agent.uid} role={agent.role} action={setAgentRole} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {org ? org.name : "Independiente"}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf || agent.role === "super_admin" ? (
                        <span
                          className={
                            agent.suspended
                              ? "text-red-600"
                              : "text-zinc-500"
                          }
                        >
                          {agent.suspended ? "Suspendida" : "Activa"}
                        </span>
                      ) : (
                        <form action={setAgentSuspended} className="flex items-center gap-2">
                          <input type="hidden" name="uid" value={agent.uid} />
                          <input
                            type="hidden"
                            name="suspended"
                            value={agent.suspended ? "false" : "true"}
                          />
                          {agent.suspended && (
                            <span className="text-xs font-medium text-red-600">Suspendida</span>
                          )}
                          <button
                            type="submit"
                            className={
                              agent.suspended
                                ? "rounded-lg bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-200"
                                : "rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                            }
                          >
                            {agent.suspended ? "Reactivar" : "Suspender"}
                          </button>
                        </form>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/${agent.slug}`} target="_blank" className="text-zinc-900 underline">
                        /{agent.slug}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!agents.length && (
            <p className="px-4 py-6 text-sm text-zinc-500">Todavía no hay agentes dados de alta.</p>
          )}
        </div>
      </section>
    </div>
  );
}
