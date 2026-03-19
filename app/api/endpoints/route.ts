import { prisma } from "@/lib/prisma";
import { ok, handleRouteError } from "@/lib/api";
import { endpointSchema } from "@/lib/validators";

export async function GET() {
  try {
    const endpoints = await prisma.endpoint.findMany({
      include: { company: true },
      orderBy: [{ company: { name: "asc" } }, { createdAt: "desc" }],
    });

    return ok(endpoints);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = endpointSchema.parse(await request.json());
    const endpoint = await prisma.endpoint.create({
      data: payload,
      include: { company: true },
    });

    return ok(endpoint, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
