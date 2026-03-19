import { fail, ok, handleRouteError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hasValidCronSecret } from "@/lib/runtime";

export async function POST(request: Request) {
  try {
    if (!hasValidCronSecret(request)) {
      return fail("Unauthorized", 401);
    }

    const body = (await request.json()) as { prefix?: string };
    const prefix = body.prefix?.trim();

    if (!prefix || !prefix.startsWith("pw-e2e-")) {
      return fail("A safe pw-e2e prefix is required", 400);
    }

    await prisma.endpoint.deleteMany({
      where: {
        OR: [
          { url: { contains: prefix } },
          { company: { name: { startsWith: prefix } } },
        ],
      },
    });

    await prisma.company.deleteMany({
      where: {
        name: { startsWith: prefix },
      },
    });

    return ok({ success: true, cleanedPrefix: prefix });
  } catch (error) {
    return handleRouteError(error);
  }
}
