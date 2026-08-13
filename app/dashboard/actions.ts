"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SocialPlatform } from "@/lib/types";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");

  const { error } = await supabase
    .from("agents")
    .update({
      full_name: String(formData.get("full_name") ?? ""),
      title: String(formData.get("title") ?? ""),
      bio: String(formData.get("bio") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      whatsapp: String(formData.get("whatsapp") ?? ""),
      brand_color: String(formData.get("brand_color") ?? "#e11d48"),
      photo_url: String(formData.get("photo_url") ?? ""),
      slug: slug || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?saved=1");
}

export async function addSocialLink(formData: FormData) {
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

  await supabase.from("social_links").insert({
    agent_id: agent.id,
    platform: String(formData.get("platform") ?? "website") as SocialPlatform,
    url: String(formData.get("url") ?? ""),
  });

  revalidatePath("/dashboard");
}

export async function deleteSocialLink(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  await supabase.from("social_links").delete().eq("id", id);
  revalidatePath("/dashboard");
}
