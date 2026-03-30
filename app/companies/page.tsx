import { SectionHeader } from "@/components/section-header";
import { CompaniesClient } from "@/components/companies-client";

export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const companies = await fetch("/api/companies").then((r) => r.json());

  return (
    <div>
      <SectionHeader
        title="Company management"
        description="Create owners for monitored services, keep tax and address details in one place, and link multiple endpoints to each company."
      />
      <CompaniesClient initialCompanies={companies} />
    </div>
  );
}
