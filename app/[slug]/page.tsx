import { notFound } from "next/navigation";
import Image from "next/image";
import { adminDb } from "@/lib/firebase/admin";
import { docToAgent } from "@/lib/firebase/session";
import { docToCatalogItem } from "@/lib/firebase/catalog";
import { getVerticalConfig } from "@/lib/verticals";
import type { SocialLink } from "@/lib/types";
import { logProfileView } from "./actions";
import { ContactForm } from "./contact-form";
import { TrackedLink } from "./tracked-link";
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

function buildVCard(fullName: string, title: string, phone?: string | null, email?: string | null) {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${fullName}`,
    `TITLE:${title ?? ""}`,
    phone ? `TEL;TYPE=CELL:${phone}` : "",
    email ? `EMAIL:${email}` : "",
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

  const slugDoc = await adminDb.collection("slugs").doc(slug).get();
  if (!slugDoc.exists) notFound();
  const uid = slugDoc.data()!.uid as string;

  const agentDoc = await adminDb.collection("agents").doc(uid).get();
  if (!agentDoc.exists) notFound();
  const agent = docToAgent(uid, agentDoc.data()!);
  const vertical = getVerticalConfig(agent.vertical);

  const [linksSnap, catalogSnap] = await Promise.all([
    adminDb.collection("agents").doc(uid).collection("socialLinks").get(),
    adminDb.collection("agents").doc(uid).collection("catalogItems").orderBy("createdAt", "desc").get(),
  ]);

  const links: SocialLink[] = linksSnap.docs.map((doc) => ({
    id: doc.id,
    agent_id: uid,
    platform: doc.data().platform,
    url: doc.data().url,
    position: doc.data().position ?? 0,
  }));

  const catalogItems = catalogSnap.docs.map((doc) => docToCatalogItem(uid, doc.id, doc.data()));

  await logProfileView(uid);

  const brandColor = agent.brand_color ?? "#e11d48";
  const vcardHref = `data:text/vcard;charset=utf-8,${encodeURIComponent(
    buildVCard(agent.full_name, agent.title ?? "", agent.phone, agent.email)
  )}`;

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

          {!!links.length && (
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              {links.map((link) => {
                const Icon = socialIcon[link.platform] ?? Globe;
                return (
                  <TrackedLink
                    key={link.id}
                    agentId={uid}
                    kind="social_click"
                    platform={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    <Icon size={18} />
                  </TrackedLink>
                );
              })}
            </div>
          )}

          <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row">
            {agent.phone && (
              <TrackedLink
                agentId={uid}
                kind="phone_click"
                href={`tel:${agent.phone}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-300 py-2 text-sm font-medium text-zinc-800"
              >
                <Phone size={16} /> Llamar
              </TrackedLink>
            )}
            {agent.email && (
              <TrackedLink
                agentId={uid}
                kind="email_click"
                href={`mailto:${agent.email}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-300 py-2 text-sm font-medium text-zinc-800"
              >
                <Mail size={16} /> Enviar correo
              </TrackedLink>
            )}
          </div>
          <TrackedLink
            agentId={uid}
            kind="vcard_download"
            href={vcardHref}
            download={`${agent.full_name}.vcf`}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 py-2 text-sm font-medium text-zinc-800"
          >
            <UserPlus size={16} /> Guardar contacto
          </TrackedLink>
        </div>

        {!!catalogItems.length && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {vertical.catalogLabel}
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {catalogItems.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-xl border border-zinc-200">
                  {item.photo_url && (
                    <Image
                      src={item.photo_url}
                      alt={item.title}
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
                      {vertical.statusLabels[item.status]}
                    </span>
                    <p className="mt-1 text-sm font-medium text-zinc-900">{item.title}</p>
                    {vertical.extraFields.map((field) =>
                      item.extra_fields[field.key] ? (
                        <p key={field.key} className="text-xs text-zinc-500">
                          {item.extra_fields[field.key]}
                        </p>
                      ) : null
                    )}
                    {item.price && (
                      <p className="mt-1 text-sm font-semibold text-zinc-900">
                        {item.currency} ${item.price.toLocaleString()}
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
            <ContactForm agentId={uid} brandColor={brandColor} />
          </div>
        </div>
      </div>
    </div>
  );
}
