import { fail, ok, handleRouteError } from "@/lib/api";
import { runMonitoringCycle } from "@/lib/monitoring";
import { hasValidCronSecret } from "@/lib/runtime";

export async function GET(request: Request) {
  try {
    if (!hasValidCronSecret(request)) {
      return fail("Unauthorized", 401);
    }

    await runMonitoringCycle(true);
    return ok({ success: true, source: "cron" });
  } catch (error) {
    return handleRouteError(error);
  }
}
