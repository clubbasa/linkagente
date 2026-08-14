import { redirect } from "next/navigation";
import { getSessionAgent } from "@/lib/firebase/session";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionAgent();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
