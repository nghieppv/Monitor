import { ok, fail } from "@/lib/api";
import { getDashboardData } from "@/lib/monitoring";

export async function GET(request: Request) {
  try {
    const data = await getDashboardData();
    return ok(data);
  } catch {
    return fail("Internal server error");
  }
}
