import { getOrganizationName } from "@/lib/firebase/organizations";
import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { org } = await searchParams;
  const orgName = org ? await getOrganizationName(org) : null;

  return <SignupForm organizationId={org ?? null} orgName={orgName} />;
}
