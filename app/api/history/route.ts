import { ok, handleRouteError } from "@/lib/api";
import { getHistoryData } from "@/lib/history";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const data = await getHistoryData({
      companyId: searchParams.get("companyId") ?? undefined,
      endpointId: searchParams.get("endpointId") ?? undefined,
    });

    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}
