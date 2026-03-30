import { query } from "@/lib/mssql";

export async function getSettings() {
  const rows = await query<any>(`SELECT TOP 1 id, telegramBotToken, telegramChatId, intervalSeconds, timeoutMs, warningThreshold, lastMonitoringAt FROM Settings`, []);
  return rows[0] ?? { id: 'default', telegramBotToken: null, telegramChatId: null, intervalSeconds: 300, timeoutMs: 10000, warningThreshold: 2500, lastMonitoringAt: null };
}

export async function upsertSettings(payload: { telegramBotToken?: string | null; telegramChatId?: string | null; intervalSeconds?: number; timeoutMs?: number; warningThreshold?: number; lastMonitoringAt?: Date | string | null }) {
  const sql = require('mssql');
  const inputs = [
    { name: 'telegramBotToken', value: payload.telegramBotToken ?? null, type: sql.NVarChar },
    { name: 'telegramChatId', value: payload.telegramChatId ?? null, type: sql.NVarChar },
    { name: 'intervalSeconds', value: payload.intervalSeconds ?? 300, type: sql.Int },
    { name: 'timeoutMs', value: payload.timeoutMs ?? 10000, type: sql.Int },
    { name: 'warningThreshold', value: payload.warningThreshold ?? 2500, type: sql.Int },
    { name: 'lastMonitoringAt', value: payload.lastMonitoringAt ?? null, type: sql.DateTime }
  ];
  const q = `IF EXISTS (SELECT 1 FROM Settings WHERE id = 'default')
    UPDATE Settings SET telegramBotToken=@telegramBotToken, telegramChatId=@telegramChatId, intervalSeconds=@intervalSeconds, timeoutMs=@timeoutMs, warningThreshold=@warningThreshold, lastMonitoringAt=@lastMonitoringAt WHERE id = 'default'
  ELSE
    INSERT INTO Settings (id, telegramBotToken, telegramChatId, intervalSeconds, timeoutMs, warningThreshold, lastMonitoringAt) VALUES ('default', @telegramBotToken, @telegramChatId, @intervalSeconds, @timeoutMs, @warningThreshold, @lastMonitoringAt)`;
  await (require('./mssql') as any).query(q, inputs);
}
