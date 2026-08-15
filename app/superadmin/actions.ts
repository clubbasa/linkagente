"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionAgent } from "@/lib/firebase/session";
import type { Role } from "@/lib/types";

const VALID_ROLES: Role[] = ["agent", "distributor_admin", "super_admin"];

async function requireSuperAdmin() {
  const session = await getSessionAgent();
  if (!session || session.agent.role !== "super_admin") {
    redirect("/dashboard");
  }
  return session;
}

// Cambia el rol de OTRO agente — nunca el propio, para que un super_admin
// no pueda degradarse/bloquearse a sí mismo por accidente. Promover a
// "distributor_admin" aquí NO crea una organización: si el agente no tiene
// ya una (creada desde "Programa de distribuidor" en /dashboard), símplemente
// no va a poder entrar a /distributor hasta que la cree él mismo — ver el
// redirect de app/distributor/page.tsx, es intencional y no rompe nada.
export async function setAgentRole(formData: FormData) {
  const session = await requireSuperAdmin();
  const uid = String(formData.get("uid") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!VALID_ROLES.includes(role as Role)) {
    redirect(`/superadmin?error=${encodeURIComponent("Rol inválido.")}`);
  }
  if (uid === session.uid) {
    redirect(`/superadmin?error=${encodeURIComponent("No puedes cambiar tu propio rol desde aquí.")}`);
  }

  await adminDb
    .collection("agents")
    .doc(uid)
    .set({ role, updatedAt: new Date().toISOString() }, { merge: true });

  revalidatePath("/superadmin");
  redirect("/superadmin?saved=1");
}

// Suspende o reactiva la cuenta de OTRO agente. Mientras está suspendida:
// - No puede entrar a /dashboard ni /distributor (ver esos layouts).
// - Su perfil público (/[slug]) deja de existir (404) — ver app/[slug]/page.tsx.
// No se puede suspender ni a uno mismo ni a otro super_admin (para eso
// primero hay que bajarle el rol desde aquí mismo).
export async function setAgentSuspended(formData: FormData) {
  const session = await requireSuperAdmin();
  const uid = String(formData.get("uid") ?? "");
  const suspended = formData.get("suspended") === "true";

  if (uid === session.uid) {
    redirect(`/superadmin?error=${encodeURIComponent("No puedes suspender tu propia cuenta.")}`);
  }

  const targetSnap = await adminDb.collection("agents").doc(uid).get();
  if (targetSnap.exists && targetSnap.data()?.role === "super_admin") {
    redirect(
      `/superadmin?error=${encodeURIComponent(
        "No puedes suspender a otro super admin — primero bájale el rol."
      )}`
    );
  }

  await adminDb
    .collection("agents")
    .doc(uid)
    .set({ suspended, updatedAt: new Date().toISOString() }, { merge: true });

  revalidatePath("/superadmin");
  redirect("/superadmin?saved=1");
}
