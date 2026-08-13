import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionAgent } from "@/lib/firebase/session";
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
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
