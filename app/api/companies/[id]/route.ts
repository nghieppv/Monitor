import { ok, fail } from "@/lib/api";
import { query } from "@/lib/mssql";
import { companySchema } from "@/lib/validators";
const mssql = require('mssql');

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const companyRows = await query<{ id: string; name: string; taxCode: string | null; address: string | null; note: string | null }>(
      `SELECT CAST(id AS VARCHAR(36)) AS id, name, taxCode, address, note FROM Company WHERE id = @id`,
      [{ name: "id", value: id, type: (mssql as any).VarChar }]
    );

    if (!companyRows.length) return fail("Company not found", 404);
    const company = companyRows[0];
    const endpoints = await query<any>(
      `SELECT CAST(id AS VARCHAR(36)) AS id, url, type, active, currentStatus, lastResponseTime, lastCheckedAt FROM Endpoint WHERE companyId = @companyId ORDER BY url`,
      [{ name: "companyId", value: id, type: (mssql as any).VarChar }]
    );
    (company as any).endpoints = endpoints;
    return ok(company);
  } catch (error) {
    return fail("Internal server error");
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = companySchema.parse(await request.json());
    await query(`UPDATE Company SET name=@name, taxCode=@tax_code, address=@address, note=@note WHERE id=@id`, [
      { name: "id", value: id, type: (mssql as any).VarChar },
      { name: "name", value: payload.name, type: (mssql as any).NVarChar },
      { name: "tax_code", value: payload.tax_code ?? null, type: (mssql as any).NVarChar },
      { name: "address", value: payload.address ?? null, type: (mssql as any).NVarChar },
      { name: "note", value: payload.note ?? null, type: (mssql as any).NVarChar }
    ])
    const updated = await query(`SELECT CAST(id AS VARCHAR(36)) AS id, name, taxCode AS taxCode, address, note FROM Company WHERE id = @id`, [
      { name: "id", value: id, type: (mssql as any).VarChar }
    ]);
    return ok(updated[0]);
  } catch (error) {
    return fail("Internal server error");
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await query(`DELETE FROM Company WHERE id = @id`, [{ name: "id", value: id, type: (require('mssql') as any).VarChar }]);
    return ok({ success: true });
  } catch (error) {
    return fail("Internal server error");
  }
}
