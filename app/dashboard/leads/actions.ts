"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { requireSessionUid } from "@/lib/firebase/session";
import type { LeadStatus } from "@/lib/types";

export async function updateLeadStatus(formData: FormData) {
  const uid = await requireSessionUid();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "new") as LeadStatus;

  await adminDb
    .collection("agents")
    .doc(uid)
    .collection("leads")
    .doc(id)
    .set({ status }, { merge: true });

  revalidatePath("/dashboard/leads");
}
