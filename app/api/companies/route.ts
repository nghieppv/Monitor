import { ok, fail } from "@/lib/api";
import { query } from "@/lib/mssql";
import { companySchema } from "@/lib/validators";
const sql = require('mssql');

export async function GET() {
  try {
    const rows = await query<{ id: string; name: string; taxCode: string | null; address: string | null; note: string | null }>(
      `SELECT CAST(id AS VARCHAR(36)) AS id, name, taxCode, address, note FROM Company ORDER BY name ASC`
    );
    return ok(rows);
  } catch (error) {
    return fail("Internal server error");
  }
}

export async function POST(request: Request) {
  try {
    const payload = companySchema.parse(await request.json());
    const result = await query<{ id: string }>(
      `INSERT INTO Company (name, taxCode, address, note) OUTPUT INSERTED.id VALUES (@name, @tax_code, @address, @note)`,
      [
        { name: "name", value: payload.name, type: sql.NVarChar },
        { name: "tax_code", value: payload.tax_code ?? null, type: sql.NVarChar },
        { name: "address", value: payload.address ?? null, type: sql.NVarChar },
        { name: "note", value: payload.note ?? null, type: sql.NVarChar },
      ]
    );
    const id = result?.[0]?.id ?? null;
    return ok({ id, name: payload.name }, { status: 201 });
  } catch (error) {
    return fail("Internal server error");
  }
}
