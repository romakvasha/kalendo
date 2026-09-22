import { OnboardingWizard } from "./_components/onboarding-wizard";
import type { Industry } from "@/lib/types";

const INDUSTRIES: Industry[] = [
  "hair",
  "beauty",
  "physio",
  "dental",
  "auto",
  "other",
];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OnboardingPage(props: PageProps<"/onboarding">) {
  const params = await props.searchParams;
  const industry = first(params.industry);

  return (
    <OnboardingWizard
      initialName={first(params.name)}
      initialPhone={first(params.phone)}
      initialIndustry={
        INDUSTRIES.find((item) => item === industry) ?? undefined
      }
    />
  );
}
