import { ok, fail } from "@/lib/api";
import { query } from "@/lib/mssql";
import { endpointSchema } from "@/lib/validators";
const sql = require('mssql');

export async function GET() {
  try {
    const rows = await query<{ id: string; url: string; type: string; active: boolean; currentStatus: string; lastResponseTime: number | null; lastCheckedAt: Date | string | null; companyName: string }>(
      `SELECT CAST(e.id AS VARCHAR(36)) AS id, e.url, e.type, e.active, e.currentStatus, e.lastResponseTime, e.lastCheckedAt, c.name AS companyName
       FROM Endpoint e JOIN Company c ON e.companyId = c.id
       ORDER BY c.name ASC, e.url ASC`
    );
    return ok(rows);
  } catch {
    return fail("Internal server error");
  }
}

export async function POST(request: Request) {
  try {
    const payload = endpointSchema.parse(await request.json()) as any;
    const sql = require('mssql');
    const result = await query<{ id: string }>(
      `INSERT INTO Endpoint (id, companyId, url, type, active, currentStatus) OUTPUT INSERTED.id VALUES (NEWID(), @companyId, @url, @type, @active, @currentStatus)`,
      [
        { name: "companyId", value: payload.companyId, type: sql.NVarChar },
        { name: "url", value: payload.url, type: sql.NVarChar },
        { name: "type", value: payload.type, type: sql.NVarChar },
        { name: "active", value: payload.active ?? true, type: sql.Bit },
        { name: "currentStatus", value: 'UNKNOWN', type: sql.NVarChar },
      ]
    );
    const id = result?.[0]?.id ?? null;
    return ok({ id, url: payload.url, type: payload.type }, { status: 201 });
  } catch {
    return fail("Internal server error");
  }
}
