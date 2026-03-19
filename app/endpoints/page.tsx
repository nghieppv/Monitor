import { prisma } from "@/lib/prisma";
import { SectionHeader } from "@/components/section-header";
import { EndpointsClient } from "@/components/endpoints-client";

export const dynamic = "force-dynamic";

export default async function EndpointsPage() {
  const [companies, endpoints] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.endpoint.findMany({
      include: { company: true },
      orderBy: [{ company: { name: "asc" } }, { createdAt: "desc" }],
    }),
  ]);

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
