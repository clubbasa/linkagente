import Link from "next/link";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionAgent } from "@/lib/firebase/session";
import { VERTICAL_OPTIONS } from "@/lib/verticals";
import { getSiteUrl } from "@/lib/site-url";
import type { SocialLink } from "@/lib/types";
import { addSocialLink, becomeDistributor, deleteSocialLink, updateProfile } from "./actions";
import { ImageUploadField } from "./image-upload-field";

export default async function DashboardProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const session = await getSessionAgent();
  if (!session) redirect("/login");
  const { uid, agent } = session;

  const linksSnap = await adminDb
    .collection("agents")
    .doc(uid)
    .collection("socialLinks")
    .get();
  const links: SocialLink[] = linksSnap.docs.map((doc) => ({
    id: doc.id,
    agent_id: uid,
    platform: doc.data().platform,
    url: doc.data().url,
    position: doc.data().position ?? 0,
  }));

  const publicUrl = `/${agent.slug}`;
  const absoluteUrl = `${getSiteUrl()}${publicUrl}`;

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-500">Tu link público</p>
        <div className="mt-1 flex items-center gap-3">
          <Link href={publicUrl} target="_blank" className="font-medium text-zinc-900 underline">
            {absoluteUrl}
          </Link>
        </div>
        <Link
          href="/dashboard/share"
          className="mt-2 inline-block text-sm text-zinc-500 underline hover:text-zinc-700"
        >
          Ver código QR para compartir
        </Link>
      </div>

      {saved && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Perfil guardado correctamente.
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Programa de distribuidor</h2>
        {agent.role === "distributor_admin" ? (
          <>
            <p className="mt-2 text-sm text-zinc-600">
              Ya tienes tu propia red de distribución.
            </p>
            <Link
              href="/distributor"
              className="mt-3 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Ir a mi panel de distribuidor
            </Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-zinc-600">
              ¿Traes contigo a otros agentes/vendedores? Crea tu propia red: tú les compartes su link
              de invitación, ellos se registran solos, y los ves a todos desde tu panel de
              distribuidor con tu logo y color.
            </p>
            <form action={becomeDistributor} className="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <label className="text-sm font-medium text-zinc-700">Nombre de tu red</label>
                <input
                  name="org_name"
                  placeholder={`Red de ${agent.full_name || "tu equipo"}`}
                  className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
              >
                Crear mi red de distribución
              </button>
            </form>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Editar perfil</h2>
        <form action={updateProfile} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-zinc-700">Nombre completo</label>
            <input
              name="full_name"
              defaultValue={agent.full_name}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Título</label>
            <input
              name="title"
              defaultValue={agent.title ?? ""}
              placeholder="Asesora Inmobiliaria"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-zinc-700">Bio corta</label>
            <textarea
              name="bio"
              defaultValue={agent.bio ?? ""}
              rows={3}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Slug (URL pública)</label>
            <input
              name="slug"
              defaultValue={agent.slug}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Giro de mercado</label>
            <select
              name="vertical"
              defaultValue={agent.vertical}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              {VERTICAL_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-400">
              Cambia el catálogo y los campos que se piden — ojo: los ítems que ya tengas guardan sus
              campos anteriores.
            </p>
          </div>
          <div>
            <ImageUploadField
              name="photo_url"
              label="Foto de perfil"
              defaultValue={agent.photo_url}
              folder="profile-photos"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Teléfono</label>
            <input
              name="phone"
              defaultValue={agent.phone ?? ""}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Correo público</label>
            <input
              name="email"
              defaultValue={agent.email ?? ""}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">WhatsApp</label>
            <input
              name="whatsapp"
              defaultValue={agent.whatsapp ?? ""}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">Color de marca</label>
            <input
              type="color"
              name="brand_color"
              defaultValue={agent.brand_color ?? "#e11d48"}
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
        <h2 className="text-lg font-semibold text-zinc-900">Redes sociales</h2>
        <ul className="mt-4 flex flex-col gap-2">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            >
              <span>
                <strong className="capitalize">{link.platform}</strong> — {link.url}
              </span>
              <form action={deleteSocialLink}>
                <input type="hidden" name="id" value={link.id} />
                <button className="text-red-600 hover:underline">Eliminar</button>
              </form>
            </li>
          ))}
          {!links.length && (
            <p className="text-sm text-zinc-500">Todavía no agregas redes sociales.</p>
          )}
        </ul>

        <form action={addSocialLink} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-sm font-medium text-zinc-700">Plataforma</label>
            <select
              name="platform"
              className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="linkedin">LinkedIn</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="x">X</option>
              <option value="website">Sitio web</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-zinc-700">URL</label>
            <input
              name="url"
              required
              placeholder="https://instagram.com/tu-usuario"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
          >
            Agregar
          </button>
        </form>
      </section>
    </div>
  );
}
