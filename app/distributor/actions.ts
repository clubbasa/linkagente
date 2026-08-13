"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { requireSessionUid } from "@/lib/firebase/session";
import { slugify } from "@/lib/slug";

// Confirma que el agente actual es dueño de una organización y devuelve su
// id — todas las acciones de este archivo empiezan por aquí para no confiar
// nunca en un organizationId mandado desde el formulario del cliente.
async function requireOwnedOrganizationId(uid: string): Promise<string> {
  const agentSnap = await adminDb.collection("agents").doc(uid).get();
  const data = agentSnap.data();
  if (!data || data.role !== "distributor_admin" || !data.organizationId) {
    redirect("/dashboard");
  }
  return data.organizationId as string;
}

export async function updateOrganization(formData: FormData) {
  const uid = await requireSessionUid();
  const orgId = await requireOwnedOrganizationId(uid);
  const orgRef = adminDb.collection("organizations").doc(orgId);

  const name = String(formData.get("name") ?? "").trim();
  const logoUrl = String(formData.get("logo_url") ?? "").trim();
  const brandColor = String(formData.get("brand_color") ?? "#e11d48");
  const requestedSlug = slugify(String(formData.get("slug") ?? ""));

  const current = await orgRef.get();
  const previousSlug = current.data()?.slug as string | undefined;

  if (requestedSlug && requestedSlug !== previousSlug) {
    const slugDoc = await adminDb.collection("orgSlugs").doc(requestedSlug).get();
    if (slugDoc.exists && slugDoc.data()?.orgId !== orgId) {
      redirect(`/distributor?error=${encodeURIComponent("Ese link ya está en uso por otra red.")}`);
    }
    await adminDb.collection("orgSlugs").doc(requestedSlug).set({ orgId });
    if (previousSlug) {
      await adminDb.collection("orgSlugs").doc(previousSlug).delete();
    }
  }

  await orgRef.set(
    {
      ...(name ? { name } : {}),
      logoUrl: logoUrl || null,
      brandColor,
      ...(requestedSlug ? { slug: requestedSlug } : {}),
    },
    { merge: true }
  );

  revalidatePath("/distributor");
  redirect("/distributor?saved=1");
}
