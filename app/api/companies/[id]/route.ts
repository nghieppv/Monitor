import { prisma } from "@/lib/prisma";
import { fail, ok, handleRouteError } from "@/lib/api";
import { companySchema } from "@/lib/validators";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const company = await prisma.company.findUnique({
      where: { id },
      include: { endpoints: { orderBy: { createdAt: "desc" } } },
    });

    if (!company) return fail("Company not found", 404);
    return ok(company);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = companySchema.parse(await request.json());
    const company = await prisma.company.update({
      where: { id },
      data: {
        name: payload.name,
        taxCode: payload.tax_code || null,
        address: payload.address || null,
        note: payload.note || null,
      },
    });

    return ok(company);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.company.delete({ where: { id } });
    return ok({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
