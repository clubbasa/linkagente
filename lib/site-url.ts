// Resuelve la URL pública base del sitio (para armar links absolutos, QR,
// etc.) sin tener que hardcodear un dominio. Prioridad:
// 1. NEXT_PUBLIC_SITE_URL — para cuando se conecte un dominio propio o de
//    marca blanca.
// 2. VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL — que Vercel expone
//    automáticamente en cada build/runtime.
// 3. localhost, para desarrollo local.
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}
