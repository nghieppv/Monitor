import { ok, fail } from "@/lib/api";
import { query } from "@/lib/mssql";
import { getSettings } from "@/lib/settings";

type EndpointRow = any

let runningPromise: Promise<void> | null = null;

function deriveState(httpCode: number | null, responseTime: number, warningThreshold: number, error?: string): string {
  if (error || httpCode == null) return "DOWN";
  if (httpCode >= 200 && httpCode <= 399) {
    return responseTime > warningThreshold ? "WARNING" : "OK";
  }
  return "DOWN";
}

async function checkEndpoint(endpoint: any, timeoutMs: number, warningThreshold: number) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let httpCode: number | null = null;
  let message: string | null = null;
  try {
    const resp = await fetch(endpoint.url, { method: "GET", cache: "no-store", signal: controller.signal, headers: endpoint.type === "api" ? { Accept: "application/json" } : undefined });
    httpCode = resp.status;
    if (!resp.ok) message = `HTTP ${resp.status}`;
  } catch (e) {
    message = (e as Error).message;
  } finally {
    clearTimeout(timeout);
  }
  const responseTime = Date.now() - startedAt;
  const nextState = deriveState(httpCode, responseTime, warningThreshold, message ?? undefined);
  const checkedAt = new Date();
  await query(`UPDATE Endpoint SET currentStatus=@currentStatus, lastResponseTime=@responseTime, lastCheckedAt=@checkedAt, lastHttpCode=@httpCode, lastError=@message WHERE id=@id`, [
    { name: "id", value: endpoint.id, type: (require('mssql') as any).VarChar },
    { name: "currentStatus", value: nextState, type: (require('mssql') as any).NVarChar },
    { name: "responseTime", value: responseTime, type: (require('mssql') as any).Int },
    { name: "checkedAt", value: checkedAt, type: (require('mssql') as any).DateTime },
    { name: "httpCode", value: httpCode, type: (require('mssql') as any).Int },
    { name: "message", value: message, type: (require('mssql') as any).NVarChar },
  ])
  await query(`INSERT INTO EndpointStatus (endpointId, status, responseTime, httpCode, message, checkedAt) VALUES (@endpointId, @status, @responseTime, @httpCode, @message, @checkedAt)`, [
    { name: "endpointId", value: endpoint.id, type: (require('mssql') as any).UniqueIdentifier },
    { name: "status", value: nextState, type: (require('mssql') as any).NVarChar },
    { name: "responseTime", value: responseTime, type: (require('mssql') as any).Int },
    { name: "httpCode", value: httpCode, type: (require('mssql') as any).Int },
    { name: "message", value: message, type: (require('mssql') as any).NVarChar },
    { name: "checkedAt", value: checkedAt, type: (require('mssql') as any).DateTime },
  ])
  // Telegram alert logic
  await maybeSendAlert(endpoint, nextState);
}

async function maybeSendAlert(endpoint: any, nextState: string) {
  const settings = await getSettings();
  if (!settings || !settings.telegramBotToken || !settings.telegramChatId) return;
  const isDownTransition = nextState === "DOWN"; // simplified
  if (!isDownTransition) return;
  const text = `ALERT ${endpoint.companyName || endpoint.companyName || ''}\nEndpoint: ${endpoint.url}\nStatus: ${nextState}`;
  await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: settings.telegramChatId, text })
  }).catch(() => {});
  // Not persisting lastNotifiedAt here to keep simple
}

export async function runMonitoringCycle(force = false) {
  // Simple run: fetch active endpoints and check sequentially
  const endpoints = await query<{ id: string; url: string; type: string; active: boolean; companyName?: string }>(
    `SELECT e.id, e.url, e.type, e.active, c.name AS companyName FROM Endpoint e JOIN Company c ON e.companyId = c.id WHERE e.active = 1 ORDER BY c.name, e.url`
  );
  const settings = await getSettings();
  for (const ep of endpoints) {
    await checkEndpoint(ep, settings?.timeoutMs ?? 10000, settings?.warningThreshold ?? 2500);
  }
  // update lastMonitoringAt
  await query(`UPDATE Settings SET lastMonitoringAt = GETUTCDATE() WHERE id = 'default'`);
}

export async function ensureMonitoringFresh() {
  try {
    const settings = await getSettings();
    const lastMonitoringAt = settings?.lastMonitoringAt as any;
    const lastRun = lastMonitoringAt?.getTime ? lastMonitoringAt.getTime() : 0;
    const now = Date.now();
    if (!lastRun || now - lastRun >= (settings?.intervalSeconds ?? 300) * 1000) {
      await runMonitoringCycle();
    }
  } catch {
    // swallow
  }
}

export async function getDashboardData(filters?: { status?: string; companyId?: string }) {
  await ensureMonitoringFresh();
  const where = filters?.status && filters.status !== 'ALL' ? `WHERE e.currentStatus = '${filters.status}'` : '';
  const endpoints = await query<any>(`
    SELECT e.id, e.url, e.type, e.active, e.currentStatus, e.lastResponseTime, e.lastCheckedAt, e.lastHttpCode, e.lastError, c.name AS companyName
    FROM Endpoint e JOIN Company c ON e.companyId = c.id
    ${where}
    ORDER BY c.name, e.url
  `);
  const companies = await query<any>(`SELECT id, name FROM Company ORDER BY name`);
  const settings = await getSettings();
  return { summary: { total: endpoints.length, healthy: 0, warning: 0, down: 0 }, endpoints, companies, settings };
}

// Lightweight background worker starter for MSSQL migration
export function startMonitoringWorker() {
  (async () => {
    try {
      const settings = await getSettings();
      const intervalMs = (settings?.intervalSeconds ?? 300) * 1000;
      const loop = async () => {
        try {
          await runMonitoringCycle();
        } catch (e) {
          console.error("Monitoring cycle failed", e);
        }
        setTimeout(loop, intervalMs);
      };
      setTimeout(loop, intervalMs);
    } catch {
      // ignore start errors
    }
  })();
}
