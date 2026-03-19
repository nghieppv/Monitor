"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type Company = {
  id: string;
  name: string;
  taxCode: string | null;
  address: string | null;
  note: string | null;
  _count: { endpoints: number };
};

const blankForm = { name: "", tax_code: "", address: "", note: "" };

export function CompaniesClient({ initialCompanies }: { initialCompanies: Company[] }) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    const response = await fetch("/api/companies", { cache: "no-store" });
    setCompanies(await response.json());
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    await fetch(editingId ? `/api/companies/${editingId}` : "/api/companies", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setForm(blankForm);
    setEditingId(null);
    await reload();
    setBusy(false);
  }

  function edit(company: Company) {
    setEditingId(company.id);
    setForm({
      name: company.name,
      tax_code: company.taxCode ?? "",
      address: company.address ?? "",
      note: company.note ?? "",
    });
  }

  async function remove(id: string) {
    setBusy(true);
    await fetch(`/api/companies/${id}`, { method: "DELETE" });
    await reload();
    if (editingId === id) {
      setEditingId(null);
      setForm(blankForm);
    }
    setBusy(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_1.45fr]">
      <Card className="border-0 bg-white">
        <CardHeader>
          <CardTitle>{editingId ? "Edit company" : "Add company"}</CardTitle>
          <CardDescription>Capture legal and operational ownership details for monitored services.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <Input placeholder="Company name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input placeholder="Tax code" value={form.tax_code} onChange={(e) => setForm({ ...form, tax_code: e.target.value })} />
            <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Textarea placeholder="Notes" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            <div className="flex gap-3">
              <Button type="submit" disabled={busy}>
                <Plus className="mr-2 h-4 w-4" />
                {editingId ? "Update company" : "Create company"}
              </Button>
              {editingId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setForm(blankForm);
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
          <CardTitle>Companies</CardTitle>
          <CardDescription>{companies.length} organizations configured for monitoring.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tax code</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Endpoints</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium text-slate-900">{company.name}</TableCell>
                    <TableCell>{company.taxCode || "-"}</TableCell>
                    <TableCell>{company.address || "-"}</TableCell>
                    <TableCell>{company._count.endpoints}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => edit(company)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => remove(company.id)}>
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
