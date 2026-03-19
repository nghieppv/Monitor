"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime, formatResponseTime } from "@/lib/utils";

type Company = { id: string; name: string };

type Endpoint = {
  id: string;
  companyId: string;
  url: string;
  type: "web" | "api";
  active: boolean;
  currentStatus: string;
  lastResponseTime: number | null;
  lastCheckedAt: string | Date | null;
  company: Company;
};

const blankForm = { companyId: "", url: "", type: "web", active: true };

export function EndpointsClient({ initialEndpoints, companies }: { initialEndpoints: Endpoint[]; companies: Company[] }) {
  const [endpoints, setEndpoints] = useState(initialEndpoints);
  const [form, setForm] = useState({ ...blankForm, companyId: companies[0]?.id ?? "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const response = await fetch("/api/endpoints", { cache: "no-store" });
    setEndpoints(await response.json());
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    await fetch(editingId ? `/api/endpoints/${editingId}` : "/api/endpoints", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setEditingId(null);
    setForm({ ...blankForm, companyId: companies[0]?.id ?? "" });
    await reload();
    setBusy(false);
  }

  function edit(endpoint: Endpoint) {
    setEditingId(endpoint.id);
    setForm({
      companyId: endpoint.companyId,
      url: endpoint.url,
      type: endpoint.type,
      active: endpoint.active,
    });
  }

  async function remove(id: string) {
    setBusy(true);
    await fetch(`/api/endpoints/${id}`, { method: "DELETE" });
    await reload();
    if (editingId === id) {
      setEditingId(null);
      setForm({ ...blankForm, companyId: companies[0]?.id ?? "" });
    }
    setBusy(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_1.45fr]">
      <Card className="border-0 bg-white">
        <CardHeader>
          <CardTitle>{editingId ? "Edit endpoint" : "Add endpoint"}</CardTitle>
          <CardDescription>Register websites and APIs that should be checked on every cycle.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit} data-testid="endpoint-form">
            <Select data-testid="endpoint-company-select" value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Select>
            <Input data-testid="endpoint-url-input" placeholder="https://service.example.com/health" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select data-testid="endpoint-type-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "web" | "api" })}>
                <option value="web">Web</option>
                <option value="api">API</option>
              </Select>
              <Select data-testid="endpoint-active-select" value={String(form.active)} onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}>
                <option value="true">Active</option>
                <option value="false">Paused</option>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button data-testid="endpoint-submit-button" type="submit" disabled={busy}>
                <Plus className="mr-2 h-4 w-4" />
                {editingId ? "Update endpoint" : "Create endpoint"}
              </Button>
              {editingId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ ...blankForm, companyId: companies[0]?.id ?? "" });
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white">
        <CardHeader>
          <CardTitle>Endpoints</CardTitle>
          <CardDescription>{endpoints.length} monitored records across all companies.</CardDescription>
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
                  <TableHead>Response</TableHead>
                  <TableHead>Last checked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((endpoint) => (
                  <TableRow key={endpoint.id} data-testid={`endpoint-row-${endpoint.url}`}>
                    <TableCell className="font-medium text-slate-900">{endpoint.company.name}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">{endpoint.url}</TableCell>
                    <TableCell className="uppercase text-slate-600">{endpoint.type}</TableCell>
                    <TableCell>
                      <StatusBadge status={endpoint.currentStatus} />
                    </TableCell>
                    <TableCell>{formatResponseTime(endpoint.lastResponseTime)}</TableCell>
                    <TableCell>{formatDateTime(endpoint.lastCheckedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button data-testid="endpoint-edit-button" size="sm" variant="outline" onClick={() => edit(endpoint)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button data-testid="endpoint-delete-button" size="sm" variant="destructive" onClick={() => remove(endpoint.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
