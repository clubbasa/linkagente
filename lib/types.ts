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

export interface Agent {
  id: string;
  user_id: string;
  organization_id: string | null;
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
  created_at: string;
  updated_at: string;
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
  created_at: string;
}
