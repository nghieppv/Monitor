import { SectionHeader } from "@/components/section-header";
import { EndpointsClient } from "@/components/endpoints-client";

export const dynamic = "force-dynamic";

export default async function EndpointsPage() {
  const companies = await fetch("/api/companies").then((r) => r.json());
  const endpoints = await fetch("/api/endpoints").then((r) => r.json());

  return (
    <div>
      <SectionHeader
        title="Endpoint management"
        description="Register websites and APIs, toggle active checks, and review each endpoint's latest performance and health state."
      />
      <EndpointsClient initialEndpoints={endpoints} companies={companies} />
    </div>
  );
}
