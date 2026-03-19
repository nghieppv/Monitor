import { ok, handleRouteError } from "@/lib/api";
import { runMonitoringCycle } from "@/lib/monitoring";

export async function POST() {
  try {
    await runMonitoringCycle(true);
    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
