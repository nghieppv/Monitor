import { HistoryClient } from "@/components/history-client";
import { SectionHeader } from "@/components/section-header";
import { getHistoryData } from "@/lib/history";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const data = await getHistoryData();

  return (
    <div>
      <SectionHeader
        title="Check history"
        description="Review uptime trends, recent incidents, and response time movement across all monitored services."
      />
      <HistoryClient initialData={data} />
    </div>
  );
}
