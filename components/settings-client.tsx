"use client";

import { useState } from "react";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Settings = {
  telegramBotToken: string | null;
  telegramChatId: string | null;
  intervalSeconds: number;
  timeoutMs: number;
  warningThreshold: number;
  lastMonitoringAt: string | Date | null;
};

export function SettingsClient({ initialSettings }: { initialSettings: Settings }) {
  const [form, setForm] = useState({
    telegramBotToken: initialSettings.telegramBotToken ?? "",
    telegramChatId: initialSettings.telegramChatId ?? "",
    intervalSeconds: String(initialSettings.intervalSeconds),
    timeoutMs: String(initialSettings.timeoutMs),
    warningThreshold: String(initialSettings.warningThreshold),
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegramBotToken: form.telegramBotToken || null,
        telegramChatId: form.telegramChatId || null,
        intervalSeconds: Number(form.intervalSeconds),
        timeoutMs: Number(form.timeoutMs),
        warningThreshold: Number(form.warningThreshold),
      }),
    });

    setBusy(false);
    setMessage(response.ok ? "Settings saved." : "Unable to save settings.");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="border-0 bg-white">
        <CardHeader>
          <CardTitle>Telegram alerts</CardTitle>
          <CardDescription>Send notifications when services go down and when they recover.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit} data-testid="settings-form">
            <Input
              data-testid="settings-telegram-token-input"
              placeholder="Telegram bot token"
              value={form.telegramBotToken}
              onChange={(e) => setForm({ ...form, telegramBotToken: e.target.value })}
            />
            <Input
              data-testid="settings-telegram-chat-id-input"
              placeholder="Telegram chat id"
              value={form.telegramChatId}
              onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                data-testid="settings-interval-input"
                type="number"
                placeholder="Interval"
                value={form.intervalSeconds}
                onChange={(e) => setForm({ ...form, intervalSeconds: e.target.value })}
              />
              <Input
                data-testid="settings-timeout-input"
                type="number"
                placeholder="Timeout"
                value={form.timeoutMs}
                onChange={(e) => setForm({ ...form, timeoutMs: e.target.value })}
              />
              <Input
                data-testid="settings-warning-threshold-input"
                type="number"
                placeholder="Warning threshold"
                value={form.warningThreshold}
                onChange={(e) => setForm({ ...form, warningThreshold: e.target.value })}
              />
            </div>
            <Button data-testid="settings-submit-button" type="submit" disabled={busy}>
              <Save className="mr-2 h-4 w-4" />
              Save settings
            </Button>
            {message ? <p data-testid="form-message" className="text-sm text-slate-600">{message}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white">
        <CardHeader>
          <CardTitle>Monitoring policy</CardTitle>
          <CardDescription>Baseline rules applied to every active endpoint check.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl bg-secondary p-4">
            <p className="text-sm font-medium text-slate-900">Check interval</p>
            <p className="mt-1 text-2xl font-bold">{form.intervalSeconds}s</p>
          </div>
          <div className="rounded-2xl bg-secondary p-4">
            <p className="text-sm font-medium text-slate-900">Timeout</p>
            <p className="mt-1 text-2xl font-bold">{form.timeoutMs} ms</p>
          </div>
          <div className="rounded-2xl bg-secondary p-4">
            <p className="text-sm font-medium text-slate-900">Warning threshold</p>
            <p className="mt-1 text-2xl font-bold">{form.warningThreshold} ms</p>
          </div>
          <p className="text-sm text-slate-500">
            Duplicate Telegram alerts are suppressed by storing the last notified failure state per endpoint.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
