import { ok, fail } from "@/lib/api";
import { getSettings, upsertSettings } from "@/lib/settings";
import { settingsSchema } from "@/lib/validators";

export async function GET() {
  try {
    const settings = await getSettings();
    return ok(settings);
  } catch {
    return fail("Internal server error");
  }
}

export async function PUT(request: Request) {
  try {
    const payload = settingsSchema.parse(await request.json());
    await upsertSettings(payload);
    return ok({ success: true });
  } catch {
    return fail("Internal server error");
  }
}
