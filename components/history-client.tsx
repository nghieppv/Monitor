"use client";

import { useMemo, useState, useTransition } from "react";
import { Activity, AlertTriangle, Gauge, RefreshCw } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatResponseTime } from "@/lib/utils";

type HistoryData = Awaited<ReturnType<typeof import("@/lib/history").getHistoryData>>;

const statCards = [
  { key: "uptimeRate", label: "Uptime", suffix: "%", icon: Activity, accent: "bg-emerald-500/15 text-emerald-700" },
  { key: "warningRate", label: "Warning rate", suffix: "%", icon: AlertTriangle, accent: "bg-amber-500/15 text-amber-700" },
  { key: "downEvents", label: "Down events", suffix: "", icon: AlertTriangle, accent: "bg-rose-500/15 text-rose-700" },
  { key: "averageResponse", label: "Avg response", suffix: " ms", icon: Gauge, accent: "bg-sky-500/15 text-sky-700" },
] as const;

function UptimeLineChart({ points }: { points: HistoryData["timeline"] }) {
  const width = 720;
  const height = 220;

  const normalized = points.filter((point) => typeof point.responseTime === "number");
  const max = normalized.length ? Math.max(...normalized.map((point) => point.responseTime ?? 0), 100) : 100;

  const polyline = normalized
    .map((point, index) => {
      const x = normalized.length === 1 ? width / 2 : (index / (normalized.length - 1)) * width;
      const y = height - ((point.responseTime ?? 0) / max) * (height - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  return (
      <div className="space-y-4" data-testid="uptime-chart-legend">
      <div className="h-[240px] w-full overflow-hidden rounded-2xl border border-border bg-slate-950 p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
          {[0.25, 0.5, 0.75].map((level) => (
            <line
              key={level}
              x1="0"
              x2={width}
              y1={height - level * height}
              y2={height - level * height}
              stroke="rgba(148,163,184,0.22)"
              strokeDasharray="4 6"
            />
          ))}
          {polyline ? <polyline fill="none" stroke="#38bdf8" strokeWidth="4" points={polyline} strokeLinejoin="round" strokeLinecap="round" /> : null}
          {normalized.map((point, index) => {
            const x = normalized.length === 1 ? width / 2 : (index / (normalized.length - 1)) * width;
            const y = height - ((point.responseTime ?? 0) / max) * (height - 20) - 10;
            const tone = point.status === "DOWN" ? "#fb7185" : point.status === "WARNING" ? "#fbbf24" : "#34d399";

            return <circle key={point.id} cx={x} cy={y} r="4" fill={tone} />;
          })}
        </svg>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span>Latest {points.length} checks</span>
        <span>Green = healthy</span>
        <span>Amber = warning</span>
        <span>Red = down</span>
      </div>
    </div>
  );
}

function MiniUptimeBar({ statuses }: { statuses: HistoryData["endpointUptime"][number]["statuses"] }) {
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
      {statuses.map((status) => {
        const tone =
          status.status === "OK"
            ? "bg-emerald-500"
            : status.status === "WARNING"
              ? "bg-amber-400"
              : status.status === "DOWN"
                ? "bg-rose-500"
                : "bg-slate-300";

        return <div key={status.id} className={`h-full flex-1 ${tone}`} />;
      })}
    </div>
  );
}

export function HistoryClient({ initialData }: { initialData: HistoryData }) {
  const [data, setData] = useState(initialData);
  const [companyId, setCompanyId] = useState("ALL");
  const [endpointId, setEndpointId] = useState("ALL");
  const [pending, startTransition] = useTransition();

  const endpointOptions = useMemo(() => {
    if (companyId === "ALL") return data.endpoints;
    return data.endpoints.filter((endpoint) => endpoint.companyId === companyId);
  }, [companyId, data.endpoints]);

  async function refresh(nextCompanyId = companyId, nextEndpointId = endpointId) {
    startTransition(async () => {
      const params = new URLSearchParams();
      if (nextCompanyId !== "ALL") params.set("companyId", nextCompanyId);
      if (nextEndpointId !== "ALL") params.set("endpointId", nextEndpointId);

      const response = await fetch(`/api/history?${params.toString()}`, { cache: "no-store" });
      const nextData = (await response.json()) as HistoryData;
      setData(nextData);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const value = data.summary[card.key];

          return (
            <Card key={card.key} className="border-0 bg-white">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{value}{card.suffix}</p>
                </div>
                <div className={`rounded-2xl p-3 ${card.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-0 bg-white" data-testid="history-summary">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Uptime history</CardTitle>
            <CardDescription>Inspect recent checks, filter by owner or endpoint, and spot performance drift quickly.</CardDescription>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <Select
              data-testid="history-company-filter"
              value={companyId}
              onChange={(event) => {
                const nextCompanyId = event.target.value;
                setCompanyId(nextCompanyId);
                setEndpointId("ALL");
                void refresh(nextCompanyId, "ALL");
              }}
            >
              <option value="ALL">All companies</option>
              {data.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Select>
            <Select
              data-testid="history-endpoint-filter"
              value={endpointId}
              onChange={(event) => {
                const nextEndpointId = event.target.value;
                setEndpointId(nextEndpointId);
                void refresh(companyId, nextEndpointId);
              }}
            >
              <option value="ALL">All endpoints</option>
              {endpointOptions.map((endpoint) => (
                <option key={endpoint.id} value={endpoint.id}>
                  {endpoint.company.name} - {endpoint.url}
                </option>
              ))}
            </Select>
            <Button data-testid="history-refresh-button" variant="outline" onClick={() => refresh()} disabled={pending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${pending ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <div data-testid="uptime-chart">
            <UptimeLineChart points={data.timeline} />
          </div>
          <div className="space-y-4">
            {data.endpointUptime.map((endpoint) => (
              <div key={endpoint.id} className="rounded-2xl border border-border bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{endpoint.companyName}</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">{endpoint.url}</p>
                  </div>
                  <StatusBadge status={endpoint.currentStatus} />
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <span>{endpoint.uptime}% uptime</span>
                  <span>{formatResponseTime(endpoint.lastResponseTime)}</span>
                </div>
                <div className="mt-3">
                  <MiniUptimeBar statuses={endpoint.statuses} />
                </div>
              </div>
            ))}
            {!data.endpointUptime.length ? <p className="text-sm text-slate-500">No uptime history is available for the selected filters yet.</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white">
        <CardHeader>
          <CardTitle>Recent checks</CardTitle>
          <CardDescription>Latest monitoring runs with endpoint ownership, status, and response details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table data-testid="recent-checks-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Checked at</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>HTTP</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentChecks.map((check) => (
                  <TableRow key={check.id}>
                    <TableCell>{formatDateTime(check.checkedAt)}</TableCell>
                    <TableCell className="font-medium text-slate-900">{check.endpoint.company.name}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">{check.endpoint.url}</TableCell>
                    <TableCell><StatusBadge status={check.status} /></TableCell>
                    <TableCell>{check.httpCode ?? "-"}</TableCell>
                    <TableCell>{formatResponseTime(check.responseTime)}</TableCell>
                    <TableCell>{check.message || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!data.recentChecks.length ? <p className="py-8 text-center text-sm text-slate-500">No checks recorded yet. Run monitoring once to populate this view.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
