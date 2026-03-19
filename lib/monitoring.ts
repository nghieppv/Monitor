import { EndpointState, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

type EndpointWithCompany = Prisma.EndpointGetPayload<{
  include: { company: true };
}>;

let runningPromise: Promise<void> | null = null;

type MonitoringWorkerState = {
  started: boolean;
  timer: NodeJS.Timeout | null;
};

const globalForMonitoring = globalThis as typeof globalThis & {
  __monitoringWorker__?: MonitoringWorkerState;
};

function getWorkerState(): MonitoringWorkerState {
  if (!globalForMonitoring.__monitoringWorker__) {
    globalForMonitoring.__monitoringWorker__ = {
      started: false,
      timer: null,
    };
  }

  return globalForMonitoring.__monitoringWorker__;
}

function deriveState(httpCode: number | null, responseTime: number, warningThreshold: number, error?: string) {
  if (error || httpCode == null) return EndpointState.DOWN;
  if (httpCode >= 200 && httpCode <= 399) {
    return responseTime > warningThreshold ? EndpointState.WARNING : EndpointState.OK;
  }
  return EndpointState.DOWN;
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram error: ${body}`);
  }
}

async function maybeSendAlert(endpoint: EndpointWithCompany, nextState: EndpointState) {
  const settings = await getSettings();
  if (!settings.telegramBotToken || !settings.telegramChatId) return;

  const isDownTransition = nextState === EndpointState.DOWN && endpoint.lastAlertState !== EndpointState.DOWN;
  const isRecoveryTransition =
    endpoint.lastAlertState === EndpointState.DOWN && nextState !== EndpointState.DOWN;

  if (!isDownTransition && !isRecoveryTransition) return;

  const icon = isDownTransition ? "ALERT" : "RECOVERY";
  const text = [
    `${icon} ${endpoint.company.name}`,
    `Endpoint: ${endpoint.url}`,
    `Type: ${endpoint.type.toUpperCase()}`,
    `Status: ${nextState}`,
  ].join("\n");

  await sendTelegramMessage(settings.telegramBotToken, settings.telegramChatId, text);

  await prisma.endpoint.update({
    where: { id: endpoint.id },
    data: {
      lastAlertState: nextState,
      lastNotifiedAt: new Date(),
    },
  });
}

async function checkEndpoint(endpoint: EndpointWithCompany, timeoutMs: number, warningThreshold: number) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let httpCode: number | null = null;
  let message: string | null = null;

  try {
    const response = await fetch(endpoint.url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      headers: endpoint.type === "api" ? { Accept: "application/json" } : undefined,
    });

    httpCode = response.status;
    if (!response.ok) {
      message = `HTTP ${response.status}`;
    }
  } catch (error) {
    message = error instanceof Error ? error.message : "Request failed";
  } finally {
    clearTimeout(timeout);
  }

  const responseTime = Date.now() - startedAt;
  const nextState = deriveState(httpCode, responseTime, warningThreshold, message ?? undefined);
  const checkedAt = new Date();

  await prisma.$transaction([
    prisma.endpoint.update({
      where: { id: endpoint.id },
      data: {
        currentStatus: nextState,
        lastResponseTime: responseTime,
        lastCheckedAt: checkedAt,
        lastHttpCode: httpCode,
        lastError: message,
      },
    }),
    prisma.endpointStatus.create({
      data: {
        endpointId: endpoint.id,
        status: nextState,
        responseTime,
        httpCode,
        message,
        checkedAt,
      },
    }),
  ]);

  await maybeSendAlert(endpoint, nextState);
}

export async function runMonitoringCycle(force = false) {
  if (runningPromise && !force) {
    await runningPromise;
    return;
  }

  runningPromise = (async () => {
    const settings = await getSettings();
    const endpoints = await prisma.endpoint.findMany({
      where: { active: true },
      include: { company: true },
    });

    for (const endpoint of endpoints) {
      await checkEndpoint(endpoint, settings.timeoutMs, settings.warningThreshold);
    }

    await prisma.settings.update({
      where: { id: settings.id },
      data: { lastMonitoringAt: new Date() },
    });
  })();

  try {
    await runningPromise;
  } finally {
    runningPromise = null;
  }
}

export async function ensureMonitoringFresh() {
  const settings = await getSettings();
  const lastRun = settings.lastMonitoringAt?.getTime() ?? 0;
  const now = Date.now();

  if (!lastRun || now - lastRun >= settings.intervalSeconds * 1000) {
    await runMonitoringCycle();
  }
}

export async function getDashboardData(filters?: { status?: string; companyId?: string }) {
  await ensureMonitoringFresh();

  const where: Prisma.EndpointWhereInput = {
    ...(filters?.status && filters.status !== "ALL" ? { currentStatus: filters.status as EndpointState } : {}),
    ...(filters?.companyId ? { companyId: filters.companyId } : {}),
  };

  const [endpoints, companies, summary, settings] = await Promise.all([
    prisma.endpoint.findMany({
      where,
      include: { company: true },
      orderBy: [{ company: { name: "asc" } }, { url: "asc" }],
    }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.endpoint.groupBy({
      by: ["currentStatus"],
      _count: { _all: true },
    }),
    getSettings(),
  ]);

  const counts = {
    total: 0,
    healthy: 0,
    warning: 0,
    down: 0,
  };

  for (const row of summary) {
    counts.total += row._count._all;
    if (row.currentStatus === EndpointState.OK) counts.healthy += row._count._all;
    if (row.currentStatus === EndpointState.WARNING) counts.warning += row._count._all;
    if (row.currentStatus === EndpointState.DOWN) counts.down += row._count._all;
  }

  return {
    summary: counts,
    endpoints,
    companies,
    settings,
  };
}

async function scheduleNextCycle(delayMs: number) {
  const worker = getWorkerState();

  if (worker.timer) {
    clearTimeout(worker.timer);
  }

  worker.timer = setTimeout(async () => {
    try {
      await runMonitoringCycle();
    } catch (error) {
      console.error("Background monitoring cycle failed", error);
    } finally {
      const settings = await getSettings();
      await scheduleNextCycle(settings.intervalSeconds * 1000);
    }
  }, Math.max(1000, delayMs));

  worker.timer.unref?.();
}

export async function startMonitoringWorker() {
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const worker = getWorkerState();
  if (worker.started) {
    return;
  }

  worker.started = true;

  try {
    const settings = await getSettings();
    const intervalMs = settings.intervalSeconds * 1000;
    const lastRunAt = settings.lastMonitoringAt?.getTime() ?? 0;
    const elapsedMs = lastRunAt ? Date.now() - lastRunAt : Number.POSITIVE_INFINITY;

    if (!lastRunAt || elapsedMs >= intervalMs) {
      await runMonitoringCycle();
      await scheduleNextCycle(intervalMs);
      return;
    }

    await scheduleNextCycle(intervalMs - elapsedMs);
  } catch (error) {
    worker.started = false;
    console.error("Unable to start monitoring worker", error);
  }
}
