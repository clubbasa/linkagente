import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionAgent } from "@/lib/firebase/session";
import { getVerticalConfig } from "@/lib/verticals";
import { paysDirectly } from "@/lib/billing";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionAgent();

  if (!session) {
    redirect("/login");
  }

  // Cuenta suspendida por un super_admin desde /superadmin: se bloquea todo
  // el dashboard (y /distributor, ver ese layout) en vez de dejarla entrar
  // y toparse con errores de permisos a medias.
  if (session.agent.suspended) {
    return (
      <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-zinc-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Cuenta suspendida</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Tu cuenta de LinkAgente está suspendida. Si crees que es un error, contacta al
            administrador de la plataforma.
          </p>
          <div className="mt-4">
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  const vertical = getVerticalConfig(session.agent.vertical);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="font-semibold text-zinc-900">
            Mi panel
          </Link>
          <nav className="flex items-center gap-6 text-sm text-zinc-600">
            <Link href="/dashboard" className="hover:text-zinc-900">
              Perfil
            </Link>
            <Link href="/dashboard/catalog" className="hover:text-zinc-900">
              {vertical.catalogLabel}
            </Link>
            <Link href="/dashboard/leads" className="hover:text-zinc-900">
              Leads
            </Link>
            <Link href="/dashboard/analytics" className="hover:text-zinc-900">
              Analítica
            </Link>
            <Link href="/dashboard/share" className="hover:text-zinc-900">
              Compartir
            </Link>
            {paysDirectly(session.agent) && (
              <Link href="/dashboard/billing" className="hover:text-zinc-900">
                Facturación
              </Link>
            )}
            {session.agent.role === "distributor_admin" && (
              <Link href="/distributor" className="hover:text-zinc-900">
                Mi red
              </Link>
            )}
            {session.agent.role === "super_admin" && (
              <Link href="/superadmin" className="hover:text-zinc-900">
                Super admin
              </Link>
            )}
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
