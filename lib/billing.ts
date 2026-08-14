import type { Agent } from "@/lib/types";

// Precio único de introducción — un solo plan para toda la plataforma (sin
// niveles todavía). Cambiar aquí no cambia lo que ya está creado en PayPal;
// ver lib/paypal.ts si algún día se necesita otro plan/precio.
export const SUBSCRIPTION_PRICE_MXN = 149;

// Quién necesita pagar directo a la plataforma, según el modelo de negocio
// "reventa con margen" (ver sección 4.2 del documento maestro en Notion):
// un distribuidor paga su propia suscripción y eso cubre a TODOS los
// agentes de su red — la plataforma no les cobra individualmente a ellos.
// Un agente independiente (sin organización) sí necesita su propia
// suscripción activa. El dueño de la plataforma (super_admin) nunca paga.
export function hasActiveAccess(agent: Pick<Agent, "role" | "organization_id" | "subscription_status">): boolean {
  if (agent.role === "super_admin") return true;
  if (agent.role === "agent" && agent.organization_id) return true;
  return agent.subscription_status === "active";
}

// true si el agente es quien tiene que ver/gestionar su propia suscripción
// (agentes de red de un distribuidor no ven cobros — los cubre su red).
export function paysDirectly(agent: Pick<Agent, "role" | "organization_id">): boolean {
  return !(agent.role === "agent" && agent.organization_id);
}
