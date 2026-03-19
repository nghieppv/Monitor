"use client";

import { useMemo, useState, useTransition } from "react";
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, ServerCrash } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatResponseTime } from "@/lib/utils";

type DashboardData = Awaited<ReturnType<typeof import("@/lib/monitoring").getDashboardData>>;

const summaryCards = [
  { key: "total", label: "Total endpoints", icon: Activity, accent: "bg-sky-500/15 text-sky-700" },
  { key: "healthy", label: "Healthy", icon: CheckCircle2, accent: "bg-emerald-500/15 text-emerald-700" },
  { key: "warning", label: "Warning", icon: AlertTriangle, accent: "bg-amber-500/15 text-amber-700" },
  { key: "down", label: "Down", icon: ServerCrash, accent: "bg-rose-500/15 text-rose-700" },
] as const;

export function DashboardClient({ initialData }: { initialData: DashboardData }) {
  const [data, setData] = useState(initialData);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [pending, startTransition] = useTransition();

  const filteredEndpoints = useMemo(() => {
    return data.endpoints.filter((endpoint) => {
      if (statusFilter !== "ALL" && endpoint.currentStatus !== statusFilter) return false;
      if (companyFilter !== "ALL" && endpoint.companyId !== companyFilter) return false;
      return true;
    });
  }, [companyFilter, data.endpoints, statusFilter]);

  async function refresh(runChecks = false) {
    startTransition(async () => {
      if (runChecks) {
        await fetch("/api/monitoring/run", { method: "POST" });
      }
      const response = await fetch("/api/monitoring", { cache: "no-store" });
      const nextData = (await response.json()) as DashboardData;
      setData(nextData);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const value = data.summary[card.key];

          return (
            <Card key={card.key} className="overflow-hidden border-0 bg-white">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
                </div>
                <div className={`rounded-2xl p-3 ${card.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-0 bg-white">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Endpoint health matrix</CardTitle>
            <CardDescription>
              Auto-refreshes when the monitoring interval expires. Run a manual check any time.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">All statuses</option>
              <option value="OK">OK</option>
              <option value="WARNING">Warning</option>
              <option value="DOWN">Down</option>
              <option value="UNKNOWN">Unknown</option>
            </Select>
            <Select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)}>
              <option value="ALL">All companies</option>
              {data.companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Select>
            <Button variant="outline" onClick={() => refresh(false)} disabled={pending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${pending ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => refresh(true)} disabled={pending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${pending ? "animate-spin" : ""}`} />
              Run checks
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response time</TableHead>
                  <TableHead>Last checked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEndpoints.map((endpoint) => (
                  <TableRow key={endpoint.id}>
                    <TableCell className="font-medium text-slate-900">{endpoint.company.name}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">{endpoint.url}</TableCell>
                    <TableCell className="uppercase text-slate-600">{endpoint.type}</TableCell>
                    <TableCell>
                      <StatusBadge status={endpoint.currentStatus} />
                    </TableCell>
                    <TableCell>{formatResponseTime(endpoint.lastResponseTime)}</TableCell>
                    <TableCell>{formatDateTime(endpoint.lastCheckedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!filteredEndpoints.length ? <p className="py-8 text-center text-sm text-slate-500">No endpoints match the selected filters.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
