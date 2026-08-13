export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "whatsapp"
  | "x"
  | "website";

export type PropertyStatus = "featured" | "for_sale" | "sold";

export type LeadStatus = "new" | "contacted" | "closed";

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

export interface Property {
  id: string;
  agent_id: string;
  title: string;
  address: string | null;
  price: number | null;
  currency: string;
  status: PropertyStatus;
  photo_url: string | null;
  description: string | null;
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
