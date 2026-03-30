// Simple MSSQL wrapper using dynamic require to avoid TS typings problems
let pool: any = null

function getConfig() {
  return {
    user: process.env.MSSQL_USER || 'mmonitor',
    password: process.env.MSSQL_PASSWORD || 'password',
    server: process.env.MSSQL_HOST || '123.30.127.134',
    port: Number(process.env.MSSQL_PORT) || 1433,
    database: process.env.MSSQL_DATABASE || 'MMonitor',
  }
}

export async function getPool(): Promise<any> {
  if (pool) return pool;
  const cfg = getConfig();
  const sql = require('mssql');
  const c = cfg;
  pool = await new sql.ConnectionPool({
    user: c.user,
    password: c.password,
    server: c.server,
    port: c.port,
    database: c.database,
    options: { encrypt: true, trustServerCertificate: true },
  }).connect();
  return pool;
}

export async function query<T = any>(text: string, inputs?: Array<{ name: string; value: any; type?: any }>): Promise<T[]> {
  const p = await getPool();
  const sql = require('mssql');
  const req = p.request();
  if (inputs?.length) {
    for (const inp of inputs) {
      req.input(inp.name, inp.type ?? sql.NVarChar, inp.value);
    }
  }
  const result = await req.query(text);
  return result.recordset as T[];
}
