import { query } from "@/lib/mssql";

export type HistoryFilters = { companyId?: string; endpointId?: string };

export async function getHistoryData(filters?: HistoryFilters) {
  // Minimal MSSQL-backed history data (simplified) for UI compatibility
  const companies = await query<any>(`SELECT id, name FROM Company ORDER BY name`, []);
  const endpoints = await query<any>(`SELECT e.id, e.url, e.type, e.active, e.currentStatus, c.name AS companyName, e.lastResponseTime FROM Endpoint e JOIN Company c ON e.companyId = c.id ORDER BY c.name, e.url`, []);
  const timeline: any[] = [];
  const recentChecks: any[] = [];
  const endpointUptime = endpoints.map((ep: any) => ({
    id: ep.id,
    url: ep.url,
    type: ep.type,
    companyName: ep.companyName,
    currentStatus: ep.currentStatus,
    uptime: 0,
    lastResponseTime: ep.lastResponseTime,
    statuses: [],
  }));
  const summary = { totalChecks: recentChecks.length, uptimeRate: 0, warningRate: 0, downEvents: 0, averageResponse: 0 };
  return { companies, endpoints, summary, endpointUptime, recentChecks, timeline };
}
