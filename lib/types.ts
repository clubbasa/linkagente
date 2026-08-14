export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "whatsapp"
  | "x"
  | "website";

export type CatalogItemStatus = "featured" | "for_sale" | "sold";

export type LeadStatus = "new" | "contacted" | "closed";

// Giro de mercado del agente. Determina la terminología y los campos extra
// del catálogo — ver lib/verticals.ts.
export type Vertical = "real_estate" | "herbalife" | "sales" | "insurance";

// distributor_admin = dueño de una organización (ver Organization abajo),
// con panel propio en /distributor. super_admin no tiene UI todavía — está
// reservado para cuando exista el panel de administración total.
export type Role = "agent" | "distributor_admin" | "super_admin";

// Estado de la suscripción de PayPal, tal cual la reporta su API/webhooks
// (ver lib/paypal.ts). "none" = nunca se ha suscrito.
export type SubscriptionStatus =
  | "none"
  | "approval_pending"
  | "active"
  | "suspended"
  | "cancelled"
  | "expired";

export interface Agent {
  id: string;
  user_id: string;
  organization_id: string | null;
  role: Role;
  slug: string;
  full_name: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  cover_url: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  brand_color: string | null;
  plan: "free" | "pro" | "agency";
  vertical: Vertical;
  // Cobro con PayPal — solo aplica a quien paga directo a la plataforma
  // (agentes independientes y distribuidores; ver lib/billing.ts para quién
  // necesita pagar y quién queda cubierto por la suscripción de su red).
  subscription_status: SubscriptionStatus;
  subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

// Una organización = la red de un distribuidor (o tu propia operación). Los
// agentes con `organization_id` apuntando a una organización se consideran
// parte de esa red — ver lib/firebase/organizations.ts.
export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_uid: string;
  logo_url: string | null;
  brand_color: string | null;
  created_at: string;
}

export interface SocialLink {
  id: string;
  agent_id: string;
  platform: SocialPlatform;
  url: string;
  position: number;
}

// Un ítem del catálogo del agente — una propiedad, un producto, una póliza,
// etc., según su `vertical`. Los campos comunes a todos los giros viven como
// columnas normales; los específicos de cada giro (dirección, categoría,
// tipo de plan...) se guardan en `extra_fields` — ver lib/verticals.ts.
export interface CatalogItem {
  id: string;
  agent_id: string;
  title: string;
  price: number | null;
  currency: string;
  status: CatalogItemStatus;
  photo_url: string | null;
  description: string | null;
  extra_fields: Record<string, string>;
  created_at: string;
}

export interface Lead {
  id: string;
  agent_id: string;
  property_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  status: LeadStatus;
  source: string;
  notes: string | null;
  created_at: string;
}

// Tipos de evento que se registran en `analyticsEvents` — ver
// lib/firebase/analytics.ts y app/[slug]/actions.ts.
export type AnalyticsEventKind =
  | "profile_view"
  | "lead_submitted"
  | "phone_click"
  | "email_click"
  | "whatsapp_click"
  | "vcard_download"
  | "social_click";

export interface AnalyticsEvent {
  id: string;
  type: "view" | "click";
  kind: AnalyticsEventKind;
  platform?: string | null;
  created_at: string;
}
