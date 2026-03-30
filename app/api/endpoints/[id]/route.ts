import { ok, fail } from "@/lib/api";
import { query } from "@/lib/mssql";
import { endpointSchema } from "@/lib/validators";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const endpoint = await query<any>(
      `SELECT CAST(e.id AS VARCHAR(36)) AS id, e.companyId, e.url, e.type, e.active, e.currentStatus, e.lastResponseTime, e.lastCheckedAt, e.lastHttpCode, e.lastError, e.lastAlertState, e.lastNotifiedAt, c.name AS companyName
       FROM Endpoint e JOIN Company c ON e.companyId = c.id
       WHERE e.id = @id`,
      [ { name: "id", value: id, type: (require('mssql').VarChar) } ]
    );
    return ok(endpoint[0] ?? null);
  } catch (error) {
    return fail("Internal server error");
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = endpointSchema.parse(await request.json());
    // Simple update via SQL
    await query(`UPDATE Endpoint SET url=@url, type=@type, active=@active WHERE id=@id`, [
      { name: "id", value: id, type: require('mssql').UniqueIdentifier },
      { name: "url", value: payload.url, type: require('mssql').NVarChar },
      { name: "type", value: payload.type, type: require('mssql').NVarChar },
      { name: "active", value: payload.active, type: require('mssql').Bit }
    ]);
    const updated = await query(`SELECT * FROM Endpoint WHERE id=@id`, [{ name: "id", value: id, type: require('mssql').UniqueIdentifier }]);
    return ok(updated[0]);
  } catch (error) {
    return fail("Internal server error");
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await query(`DELETE FROM Endpoint WHERE id=@id`, [ { name: "id", value: id, type: require('mssql').UniqueIdentifier } ]);
    return ok({ success: true });
  } catch (error) {
    return fail("Internal server error");
  }
}
