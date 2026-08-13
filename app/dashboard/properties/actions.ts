"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PropertyStatus } from "@/lib/types";

async function getAgentId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!agent) redirect("/dashboard");
  return { supabase, agentId: agent.id as string };
}

export async function createProperty(formData: FormData) {
  const { supabase, agentId } = await getAgentId();

  await supabase.from("properties").insert({
    agent_id: agentId,
    title: String(formData.get("title") ?? ""),
    address: String(formData.get("address") ?? ""),
    price: Number(formData.get("price") ?? 0) || null,
    currency: String(formData.get("currency") ?? "USD"),
    status: String(formData.get("status") ?? "for_sale") as PropertyStatus,
    photo_url: String(formData.get("photo_url") ?? ""),
    description: String(formData.get("description") ?? ""),
  });

  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}

export async function updateProperty(formData: FormData) {
  const { supabase, agentId } = await getAgentId();
  const id = String(formData.get("id") ?? "");

  await supabase
    .from("properties")
    .update({
      title: String(formData.get("title") ?? ""),
      address: String(formData.get("address") ?? ""),
      price: Number(formData.get("price") ?? 0) || null,
      currency: String(formData.get("currency") ?? "USD"),
      status: String(formData.get("status") ?? "for_sale") as PropertyStatus,
      photo_url: String(formData.get("photo_url") ?? ""),
      description: String(formData.get("description") ?? ""),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("agent_id", agentId);

  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}

export async function deleteProperty(formData: FormData) {
  const { supabase, agentId } = await getAgentId();
  const id = String(formData.get("id") ?? "");

  await supabase.from("properties").delete().eq("id", id).eq("agent_id", agentId);
  revalidatePath("/dashboard/properties");
}
