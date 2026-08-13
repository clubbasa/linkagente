"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { requireSessionUid } from "@/lib/firebase/session";
import { VERTICALS } from "@/lib/verticals";
import { slugify } from "@/lib/slug";
import type { SocialPlatform, Vertical } from "@/lib/types";

export async function updateProfile(formData: FormData) {
  const uid = await requireSessionUid();

  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");

  const agentRef = adminDb.collection("agents").doc(uid);
  const current = await agentRef.get();
  const previousSlug = current.data()?.slug as string | undefined;

  // Si cambió el slug, hay que mover la reserva en la colección `slugs`
  // (y revisar que el nuevo no esté tomado por otro agente).
  if (slug && slug !== previousSlug) {
    const slugDoc = await adminDb.collection("slugs").doc(slug).get();
    if (slugDoc.exists && slugDoc.data()?.uid !== uid) {
      redirect(`/dashboard?error=${encodeURIComponent("Ese slug ya está en uso por otro agente.")}`);
    }
    await adminDb.collection("slugs").doc(slug).set({ uid });
    if (previousSlug) {
      await adminDb.collection("slugs").doc(previousSlug).delete();
    }
  }

  const vertical = String(formData.get("vertical") ?? "") as Vertical;

  await agentRef.set(
    {
      fullName: String(formData.get("full_name") ?? ""),
      title: String(formData.get("title") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      whatsapp: String(formData.get("whatsapp") ?? ""),
      brandColor: String(formData.get("brand_color") ?? "#e11d48"),
      photoUrl: String(formData.get("photo_url") ?? ""),
      ...(slug ? { slug } : {}),
      ...(vertical && VERTICALS[vertical] ? { vertical } : {}),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  revalidatePath("/dashboard");
  redirect("/dashboard?saved=1");
}

export async function addSocialLink(formData: FormData) {
  const uid = await requireSessionUid();

  await adminDb.collection("agents").doc(uid).collection("socialLinks").add({
    platform: String(formData.get("platform") ?? "website") as SocialPlatform,
    url: String(formData.get("url") ?? ""),
    position: 0,
  });

  revalidatePath("/dashboard");
}

export async function deleteSocialLink(formData: FormData) {
  const uid = await requireSessionUid();
  const id = String(formData.get("id") ?? "");

  await adminDb.collection("agents").doc(uid).collection("socialLinks").doc(id).delete();
  revalidatePath("/dashboard");
}

// Convierte al agente actual en distributor_admin: crea su propia
// organización y lo asigna a ella. No se puede hacer dos veces — si ya es
// dueño de una organización, solo lo manda a su panel.
export async function becomeDistributor(formData: FormData) {
  const uid = await requireSessionUid();
  const agentRef = adminDb.collection("agents").doc(uid);
  const agentSnap = await agentRef.get();
  const agentData = agentSnap.data();

  if (agentData?.role === "distributor_admin" && agentData?.organizationId) {
    redirect("/distributor");
  }

  const name = String(formData.get("org_name") ?? "").trim() || "Mi red de distribución";
  const baseSlug = slugify(name) || "distribuidor";

  let slug = baseSlug;
  let suffix = 1;
  while ((await adminDb.collection("orgSlugs").doc(slug).get()).exists) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const orgRef = adminDb.collection("organizations").doc();
  await orgRef.set({
    name,
    slug,
    ownerUid: uid,
    logoUrl: null,
    brandColor: agentData?.brandColor ?? "#e11d48",
    createdAt: new Date().toISOString(),
  });
  await adminDb.collection("orgSlugs").doc(slug).set({ orgId: orgRef.id });

  await agentRef.set(
    { role: "distributor_admin", organizationId: orgRef.id, updatedAt: new Date().toISOString() },
    { merge: true }
  );

  revalidatePath("/dashboard");
  redirect("/distributor");
}
