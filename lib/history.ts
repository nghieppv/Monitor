import { EndpointState, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type HistoryFilters = {
  companyId?: string;
  endpointId?: string;
};

function buildEndpointWhere(filters?: HistoryFilters): Prisma.EndpointWhereInput {
  return {
    ...(filters?.companyId && filters.companyId !== "ALL" ? { companyId: filters.companyId } : {}),
    ...(filters?.endpointId && filters.endpointId !== "ALL" ? { id: filters.endpointId } : {}),
  };
}

export async function getHistoryData(filters?: HistoryFilters) {
  const endpointWhere = buildEndpointWhere(filters);

  const [companies, endpointOptions, endpoints] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.endpoint.findMany({
      where: filters?.companyId && filters.companyId !== "ALL" ? { companyId: filters.companyId } : {},
      include: { company: true },
      orderBy: [{ company: { name: "asc" } }, { url: "asc" }],
    }),
    prisma.endpoint.findMany({
      where: endpointWhere,
      include: {
        company: true,
        statuses: {
          orderBy: { checkedAt: "desc" },
          take: 48,
        },
      },
      orderBy: [{ company: { name: "asc" } }, { url: "asc" }],
    }),
  ]);

  const endpointIds = endpoints.map((endpoint) => endpoint.id);

  const recentChecks = endpointIds.length
    ? await prisma.endpointStatus.findMany({
        where: { endpointId: { in: endpointIds } },
        include: { endpoint: { include: { company: true } } },
        orderBy: { checkedAt: "desc" },
        take: 80,
      })
    : [];

  const totalChecks = recentChecks.length;
  const availableChecks = recentChecks.filter((check) => check.status !== EndpointState.UNKNOWN);
  const successfulChecks = availableChecks.filter((check) => check.status !== EndpointState.DOWN);
  const warningChecks = availableChecks.filter((check) => check.status === EndpointState.WARNING);
  const downChecks = availableChecks.filter((check) => check.status === EndpointState.DOWN);
  const averageResponse = availableChecks.length
    ? Math.round(availableChecks.reduce((sum, check) => sum + (check.responseTime ?? 0), 0) / availableChecks.length)
    : 0;

  const summary = {
    totalChecks,
    uptimeRate: availableChecks.length ? Math.round((successfulChecks.length / availableChecks.length) * 1000) / 10 : 0,
    warningRate: availableChecks.length ? Math.round((warningChecks.length / availableChecks.length) * 1000) / 10 : 0,
    downEvents: downChecks.length,
    averageResponse,
  };

  const endpointUptime = endpoints.map((endpoint) => {
    const checks = endpoint.statuses.filter((status) => status.status !== EndpointState.UNKNOWN);
    const goodChecks = checks.filter((status) => status.status !== EndpointState.DOWN).length;
    const uptime = checks.length ? Math.round((goodChecks / checks.length) * 1000) / 10 : 0;

    return {
      id: endpoint.id,
      url: endpoint.url,
      type: endpoint.type,
      companyName: endpoint.company.name,
      currentStatus: endpoint.currentStatus,
      uptime,
      lastResponseTime: endpoint.lastResponseTime,
      statuses: endpoint.statuses.slice().reverse(),
    };
  });

  const timeline = recentChecks
    .slice()
    .reverse()
    .map((check) => ({
      id: check.id,
      checkedAt: check.checkedAt,
      responseTime: check.responseTime,
      status: check.status,
      endpointUrl: check.endpoint.url,
      companyName: check.endpoint.company.name,
    }));

  return {
    companies,
    endpoints: endpointOptions,
    summary,
    endpointUptime,
    recentChecks,
    timeline,
  };
}
