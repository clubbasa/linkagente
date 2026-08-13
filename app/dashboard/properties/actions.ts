"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { requireSessionUid } from "@/lib/firebase/session";
import type { PropertyStatus } from "@/lib/types";

function propertyPayload(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    address: String(formData.get("address") ?? ""),
    price: Number(formData.get("price") ?? 0) || null,
    currency: String(formData.get("currency") ?? "USD"),
    status: String(formData.get("status") ?? "for_sale") as PropertyStatus,
    photoUrl: String(formData.get("photo_url") ?? ""),
    description: String(formData.get("description") ?? ""),
  };
}

export async function createProperty(formData: FormData) {
  const uid = await requireSessionUid();

  await adminDb
    .collection("agents")
    .doc(uid)
    .collection("properties")
    .add({ ...propertyPayload(formData), createdAt: new Date().toISOString() });

  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}

export async function updateProperty(formData: FormData) {
  const uid = await requireSessionUid();
  const id = String(formData.get("id") ?? "");

  await adminDb
    .collection("agents")
    .doc(uid)
    .collection("properties")
    .doc(id)
    .set({ ...propertyPayload(formData), updatedAt: new Date().toISOString() }, { merge: true });

  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}

export async function deleteProperty(formData: FormData) {
  const uid = await requireSessionUid();
  const id = String(formData.get("id") ?? "");

  await adminDb.collection("agents").doc(uid).collection("properties").doc(id).delete();
  revalidatePath("/dashboard/properties");
}
