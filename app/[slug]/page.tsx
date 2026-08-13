import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Agent, Property, SocialLink } from "@/lib/types";
import { logProfileView } from "./actions";
import { ContactForm } from "./contact-form";
import {
  AtSign,
  Camera,
  Briefcase,
  Video,
  MessageCircle,
  Globe,
  Music2,
  Phone,
  Mail,
  UserPlus,
} from "lucide-react";

// lucide-react ya no incluye logos de marcas (Facebook, Instagram, etc.), así
// que usamos íconos genéricos por tipo de plataforma.
const socialIcon: Record<string, React.ElementType> = {
  facebook: AtSign,
  instagram: Camera,
  linkedin: Briefcase,
  youtube: Video,
  whatsapp: MessageCircle,
  website: Globe,
  tiktok: Music2,
  x: AtSign,
};

const statusLabel: Record<Property["status"], string> = {
  featured: "Destacada",
  for_sale: "En venta",
  sold: "Vendida",
};

function buildVCard(agent: Agent) {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${agent.full_name}`,
    `TITLE:${agent.title ?? ""}`,
    agent.phone ? `TEL;TYPE=CELL:${agent.phone}` : "",
    agent.email ? `EMAIL:${agent.email}` : "",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\n");
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("slug", slug)
    .single<Agent>();

  if (!agent) notFound();

  const [{ data: links }, { data: properties }] = await Promise.all([
    supabase
      .from("social_links")
      .select("*")
      .eq("agent_id", agent.id)
      .order("position")
      .returns<SocialLink[]>(),
    supabase
      .from("properties")
      .select("*")
      .eq("agent_id", agent.id)
      .order("created_at", { ascending: false })
      .returns<Property[]>(),
  ]);

  await logProfileView(agent.id);

  const brandColor = agent.brand_color ?? "#e11d48";
  const vcardHref = `data:text/vcard;charset=utf-8,${encodeURIComponent(buildVCard(agent))}`;

  return (
    <div className="flex flex-1 justify-center bg-zinc-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          {agent.photo_url ? (
            <Image
              src={agent.photo_url}
              alt={agent.full_name}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full text-2xl font-semibold text-white"
              style={{ backgroundColor: brandColor }}
            >
              {agent.full_name?.[0] ?? "?"}
            </div>
          )}
          <h1 className="mt-3 text-lg font-semibold text-zinc-900">{agent.full_name}</h1>
          <p className="text-sm text-zinc-500">{agent.title}</p>
          {agent.bio && <p className="mt-2 text-sm text-zinc-600">{agent.bio}</p>}

          {!!links?.length && (
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {links.map((link) => {
                const Icon = socialIcon[link.platform] ?? Globe;
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          )}

          <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row">
            {agent.phone && (
              <a
                href={`tel:${agent.phone}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-300 py-2 text-sm font-medium text-zinc-800"
              >
                <Phone size={16} /> Llamar
              </a>
            )}
            {agent.email && (
              <a
                href={`mailto:${agent.email}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-300 py-2 text-sm font-medium text-zinc-800"
              >
                <Mail size={16} /> Enviar correo
              </a>
            )}
          </div>
          <a
            href={vcardHref}
            download={`${agent.full_name}.vcf`}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 py-2 text-sm font-medium text-zinc-800"
          >
            <UserPlus size={16} /> Guardar contacto
          </a>
        </div>

        {!!properties?.length && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Propiedades
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {properties.map((property) => (
                <div key={property.id} className="overflow-hidden rounded-xl border border-zinc-200">
                  {property.photo_url && (
                    <Image
                      src={property.photo_url}
                      alt={property.title}
                      width={300}
                      height={160}
                      className="h-32 w-full object-cover"
                    />
                  )}
                  <div className="p-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: brandColor }}
                    >
                      {statusLabel[property.status]}
                    </span>
                    <p className="mt-1 text-sm font-medium text-zinc-900">{property.title}</p>
                    <p className="text-xs text-zinc-500">{property.address}</p>
                    {property.price && (
                      <p className="mt-1 text-sm font-semibold text-zinc-900">
                        {property.currency} ${property.price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Contáctame
          </h2>
          <div className="mt-3">
            <ContactForm agentId={agent.id} brandColor={brandColor} />
          </div>
        </div>
      </div>
    </div>
  );
}
