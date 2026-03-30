import { ok, fail } from "@/lib/api";
import { getHistoryData } from "@/lib/history";

export async function GET() {
  try {
    const data = await getHistoryData();
    return ok(data);
  } catch {
    return fail("Internal server error");
  }
}
