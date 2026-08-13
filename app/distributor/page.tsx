import Link from "next/link";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionAgent } from "@/lib/firebase/session";
import { docToOrganization } from "@/lib/firebase/organizations";
import { getSiteUrl } from "@/lib/site-url";
import { VERTICALS } from "@/lib/verticals";
import { updateOrganization } from "./actions";

export default async function DistributorPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const session = await getSessionAgent();
  if (!session) redirect("/login");
  const { agent } = session;

  if (agent.role !== "distributor_admin" || !agent.organization_id) {
    redirect("/dashboard");
  }

  const orgSnap = await adminDb.collection("organizations").doc(agent.organization_id).get();
  if (!orgSnap.exists) redirect("/dashboard");
  const organization = docToOrganization(orgSnap.id, orgSnap.data()!);

  const agentsSnap = await adminDb
    .collection("agents")
    .where("organizationId", "==", organization.id)
    .get();
  const networkAgents = agentsSnap.docs
    .map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        fullName: String(data.fullName ?? ""),
        email: String(data.email ?? ""),
        vertical: String(data.vertical ?? ""),
        slug: String(data.slug ?? ""),
        createdAt: String(data.createdAt ?? ""),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const siteUrl = getSiteUrl();
  const inviteLink = `${siteUrl}/signup?org=${organization.id}`;
  const directoryLink = `${siteUrl}/d/${organization.slug}`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-900">Panel de distribuidor</h1>
        <Link href="/dashboard" className="text-sm text-zinc-500 underline hover:text-zinc-700">
          Volver a mi perfil
        </Link>
      </div>

      {saved && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Cambios guardados correctamente.
        </p>
      )}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Compartir con tus agentes</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Comparte este link con cada agente que quieras sumar a tu red — se registran solos y
          aparecen automáticamente aquí abajo.
        </p>
        <div className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-800 break-all">
          {inviteLink}
        </div>
        <p className="mt-4 text-sm text-zinc-600">
          Directorio público de tu red (todos tus agentes en una sola página):
        </p>
        <Link
          href={`/d/${organization.slug}`}
          target="_blank"
          className="mt-1 inline-block break-all font-medium text-zinc-900 underline"
        >
          {directoryLink}
        </Link>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Marca de tu red</h2>
        <form action={updateOrganization} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-zinc-700">Nombre</label>
            <input
              name="name"
              defaultValue={organization.name}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Link de tu directorio</label>
            <div className="mt-1 flex items-center gap-1 text-sm text-zinc-500">
              <span className="shrink-0">{siteUrl}/d/</span>
              <input
                name="slug"
                defaultValue={organization.slug}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Logo (URL)</label>
            <input
              name="logo_url"
              defaultValue={organization.logo_url ?? ""}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Color de marca</label>
            <input
              type="color"
              name="brand_color"
              defaultValue={organization.brand_color ?? "#e11d48"}
              className="mt-1 h-10 w-full rounded-lg border border-zinc-300"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">
          Agentes en tu red ({networkAgents.length})
        </h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Giro</th>
                <th className="px-4 py-3">Perfil público</th>
              </tr>
            </thead>
            <tbody>
              {networkAgents.map((networkAgent) => (
                <tr key={networkAgent.uid} className="border-t border-zinc-100">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {String(networkAgent.fullName ?? "")}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{String(networkAgent.email ?? "")}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {VERTICALS[networkAgent.vertical as keyof typeof VERTICALS]?.label ??
                      String(networkAgent.vertical ?? "")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/${networkAgent.slug}`}
                      target="_blank"
                      className="text-zinc-900 underline"
                    >
                      /{String(networkAgent.slug ?? "")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!networkAgents.length && (
            <p className="px-4 py-6 text-sm text-zinc-500">
              Todavía no tienes agentes en tu red. Comparte tu link de invitación para empezar.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
