"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { requireSessionUid } from "@/lib/firebase/session";
import { VERTICALS } from "@/lib/verticals";
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
