import { Prisma } from "@prisma/client";

import { ok, handleRouteError } from "@/lib/api";
import { getDashboardData } from "@/lib/monitoring";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const companyId = searchParams.get("companyId") ?? undefined;

    const data = await getDashboardData({ status, companyId });
    return ok(data);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return ok({ summary: { total: 0, healthy: 0, warning: 0, down: 0 }, endpoints: [], companies: [], settings: null });
    }
    return handleRouteError(error);
  }
}
