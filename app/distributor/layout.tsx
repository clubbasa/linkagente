import { redirect } from "next/navigation";
import { getSessionAgent } from "@/lib/firebase/session";

export default async function DistributorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionAgent();
  if (!session) redirect("/login");
  // Cuenta suspendida: manda a /dashboard, que es quien muestra el mensaje
  // de "cuenta suspendida" (ver app/dashboard/layout.tsx) — así no hay que
  // duplicar esa pantalla aquí.
  if (session.agent.suspended) redirect("/dashboard");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
