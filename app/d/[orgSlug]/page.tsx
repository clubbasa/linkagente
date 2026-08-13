import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import { docToOrganization } from "@/lib/firebase/organizations";
import { getVerticalConfig } from "@/lib/verticals";

export default async function OrganizationDirectoryPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  const slugDoc = await adminDb.collection("orgSlugs").doc(orgSlug).get();
  if (!slugDoc.exists) notFound();
  const orgId = slugDoc.data()!.orgId as string;

  const orgSnap = await adminDb.collection("organizations").doc(orgId).get();
  if (!orgSnap.exists) notFound();
  const organization = docToOrganization(orgSnap.id, orgSnap.data()!);

  const agentsSnap = await adminDb.collection("agents").where("organizationId", "==", orgId).get();
  const agents = agentsSnap.docs
    .map((doc) => doc.data())
    .filter((data) => data.slug)
    .sort((a, b) => String(a.fullName ?? "").localeCompare(String(b.fullName ?? "")));

  const brandColor = organization.brand_color ?? "#e11d48";

  return (
    <div className="flex flex-1 justify-center bg-zinc-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          {organization.logo_url ? (
            <Image
              src={organization.logo_url}
              alt={organization.name}
              width={72}
              height={72}
              className="h-18 w-18 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-white"
              style={{ backgroundColor: brandColor }}
            >
              {organization.name[0] ?? "?"}
            </div>
          )}
          <h1 className="mt-3 text-lg font-semibold text-zinc-900">{organization.name}</h1>
          <p className="text-sm text-zinc-500">{agents.length} agentes</p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {agents.map((agentData) => {
            const vertical = getVerticalConfig(agentData.vertical);
            return (
              <Link
                key={agentData.slug as string}
                href={`/${agentData.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 hover:border-zinc-300"
              >
                {agentData.photoUrl ? (
                  <Image
                    src={agentData.photoUrl as string}
                    alt={String(agentData.fullName ?? "")}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    {String(agentData.fullName ?? "?")[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900">
                    {String(agentData.fullName ?? "")}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {String(agentData.title ?? vertical.defaultTitle)}
                  </p>
                </div>
              </Link>
            );
          })}
          {!agents.length && (
            <p className="rounded-2xl border border-zinc-200 bg-white p-4 text-center text-sm text-zinc-500">
              Todavía no hay agentes públicos en esta red.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
