"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionAgent, requireSessionUid } from "@/lib/firebase/session";
import { getVerticalConfig } from "@/lib/verticals";
import type { CatalogItemStatus } from "@/lib/types";

// Arma el payload del ítem de catálogo: los campos comunes a todos los
// giros, más un mapa `extraFields` con los campos específicos del giro del
// agente (dirección, categoría, tipo de plan...) — ver lib/verticals.ts.
async function catalogItemPayload(formData: FormData) {
  const session = await getSessionAgent();
  const vertical = getVerticalConfig(session?.agent.vertical);

  const extraFields: Record<string, string> = {};
  for (const field of vertical.extraFields) {
    extraFields[field.key] = String(formData.get(`extra_${field.key}`) ?? "");
  }

  return {
    title: String(formData.get("title") ?? ""),
    price: Number(formData.get("price") ?? 0) || null,
    currency: String(formData.get("currency") ?? "MXN"),
    status: String(formData.get("status") ?? "for_sale") as CatalogItemStatus,
    photoUrl: String(formData.get("photo_url") ?? ""),
    description: String(formData.get("description") ?? ""),
    extraFields,
  };
}

export async function createCatalogItem(formData: FormData) {
  const uid = await requireSessionUid();
  const payload = await catalogItemPayload(formData);

  await adminDb
    .collection("agents")
    .doc(uid)
    .collection("catalogItems")
    .add({ ...payload, createdAt: new Date().toISOString() });

  revalidatePath("/dashboard/catalog");
  redirect("/dashboard/catalog");
}

export async function updateCatalogItem(formData: FormData) {
  const uid = await requireSessionUid();
  const id = String(formData.get("id") ?? "");
  const payload = await catalogItemPayload(formData);

  await adminDb
    .collection("agents")
    .doc(uid)
    .collection("catalogItems")
    .doc(id)
    .set({ ...payload, updatedAt: new Date().toISOString() }, { merge: true });

  revalidatePath("/dashboard/catalog");
  redirect("/dashboard/catalog");
}

export async function deleteCatalogItem(formData: FormData) {
  const uid = await requireSessionUid();
  const id = String(formData.get("id") ?? "");

  await adminDb.collection("agents").doc(uid).collection("catalogItems").doc(id).delete();
  revalidatePath("/dashboard/catalog");
}
