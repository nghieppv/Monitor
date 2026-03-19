import { DashboardClient } from "@/components/dashboard-client";
import { SectionHeader } from "@/components/section-header";
import { getDashboardData } from "@/lib/monitoring";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div>
      <SectionHeader
        title="Health overview"
        description="Track every endpoint, filter the fleet by ownership or status, and trigger fresh checks from one operational console."
      />
      <DashboardClient initialData={data} />
    </div>
  );
}
