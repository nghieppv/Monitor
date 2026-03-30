import { fail, ok } from "@/lib/api";
import { query } from "@/lib/mssql";
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

    // MSSQL-based cleanup: delete matching EndpointStatus/Endpoint/Company rows
    await query(`DELETE FROM EndpointStatus WHERE endpointId IN (SELECT id FROM Endpoint WHERE companyId IN (SELECT id FROM Company WHERE name LIKE @prefix))`, [
      { name: "prefix", value: `${prefix}%`, type: (require('mssql') as any).VarChar }
    ]);
    await query(`DELETE FROM Endpoint WHERE companyId IN (SELECT id FROM Company WHERE name LIKE @prefix)`, [
      { name: "prefix", value: `${prefix}%`, type: (require('mssql') as any).VarChar }
    ]);
    await query(`DELETE FROM Company WHERE name LIKE @prefix`, [
      { name: "prefix", value: `${prefix}%`, type: (require('mssql') as any).VarChar }
    ]);

    return ok({ success: true, cleanedPrefix: prefix });
  } catch (error) {
    return fail("Internal server error");
  }
}
