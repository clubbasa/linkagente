import "server-only";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/constants";
import type { Agent } from "@/lib/types";

// Verifica la cookie de sesión (creada en login/signup) contra Firebase Admin.
// Devuelve null si no hay sesión válida.
export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decoded; // incluye uid, email, etc.
  } catch {
    return null;
  }
}

// Trae al usuario autenticado + su documento de agente en un solo helper,
// para usarse en layouts/páginas del dashboard.
export async function getSessionAgent(): Promise<{ uid: string; agent: Agent } | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const snap = await adminDb.collection("agents").doc(user.uid).get();
  if (!snap.exists) return null;

  return { uid: user.uid, agent: docToAgent(user.uid, snap.data()!) };
}

// Para usarse al inicio de Server Actions que mutan datos: lanza si no hay
// sesión válida, para no confiar nunca en el cliente.
export async function requireSessionUid(): Promise<string> {
  const user = await getSessionUser();
  if (!user) throw new Error("No autenticado");
  return user.uid;
}

export function docToAgent(uid: string, data: FirebaseFirestore.DocumentData): Agent {
  return {
    id: uid,
    user_id: uid,
    organization_id: data.organizationId ?? null,
    slug: data.slug,
    full_name: data.fullName ?? "",
    title: data.title ?? "",
    bio: data.bio ?? "",
    photo_url: data.photoUrl ?? null,
    cover_url: data.coverUrl ?? null,
    phone: data.phone ?? null,
    email: data.email ?? null,
    whatsapp: data.whatsapp ?? null,
    brand_color: data.brandColor ?? "#e11d48",
    plan: data.plan ?? "free",
    vertical: data.vertical ?? "real_estate",
    created_at: data.createdAt ?? new Date().toISOString(),
    updated_at: data.updatedAt ?? new Date().toISOString(),
  };
}
