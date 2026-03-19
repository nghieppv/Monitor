import { prisma } from "@/lib/prisma";
import { ok, handleRouteError } from "@/lib/api";
import { companySchema } from "@/lib/validators";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      include: { _count: { select: { endpoints: true } } },
      orderBy: { name: "asc" },
    });

    return ok(companies);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = companySchema.parse(await request.json());
    const company = await prisma.company.create({
      data: {
        name: payload.name,
        taxCode: payload.tax_code || null,
        address: payload.address || null,
        note: payload.note || null,
      },
    });

    return ok(company, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
