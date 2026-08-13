import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
            <Link href="/dashboard/properties" className="hover:text-zinc-900">
              Propiedades
            </Link>
            <Link href="/dashboard/leads" className="hover:text-zinc-900">
              Leads
            </Link>
            <form action={signOut}>
              <button className="hover:text-zinc-900">Salir</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
