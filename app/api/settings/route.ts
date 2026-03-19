import { ok, handleRouteError } from "@/lib/api";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validators";

export async function GET() {
  try {
    const settings = await getSettings();
    return ok(settings);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const payload = settingsSchema.parse(await request.json());
    const settings = await prisma.settings.update({
      where: { id: "default" },
      data: payload,
    });

    return ok(settings);
  } catch (error) {
    return handleRouteError(error);
  }
}
