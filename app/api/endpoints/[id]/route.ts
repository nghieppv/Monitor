import { prisma } from "@/lib/prisma";
import { ok, handleRouteError } from "@/lib/api";
import { endpointSchema } from "@/lib/validators";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const endpoint = await prisma.endpoint.findUnique({
      where: { id },
      include: {
        company: true,
        statuses: {
          orderBy: { checkedAt: "desc" },
          take: 20,
        },
      },
    });

    return ok(endpoint);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = endpointSchema.parse(await request.json());
    const endpoint = await prisma.endpoint.update({
      where: { id },
      data: payload,
      include: { company: true },
    });

    return ok(endpoint);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.endpoint.delete({ where: { id } });
    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
