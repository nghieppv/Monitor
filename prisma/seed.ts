import { PrismaClient, EndpointState, EndpointType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      intervalSeconds: 300,
      timeoutMs: 10000,
      warningThreshold: 2500,
    },
  });

  const acme = await prisma.company.upsert({
    where: { id: "seed-company-acme" },
    update: {},
    create: {
      id: "seed-company-acme",
      name: "Acme Logistics",
      taxCode: "TAX-ACME-01",
      address: "12 Harbor View, Singapore",
      note: "Core customer services",
    },
  });

  const nova = await prisma.company.upsert({
    where: { id: "seed-company-nova" },
    update: {},
    create: {
      id: "seed-company-nova",
      name: "Nova Finance",
      taxCode: "TAX-NOVA-18",
      address: "88 Market Street, Hanoi",
      note: "Public API surfaces",
    },
  });

  await prisma.endpoint.upsert({
    where: { id: "seed-endpoint-acme-web" },
    update: {},
    create: {
      id: "seed-endpoint-acme-web",
      companyId: acme.id,
      url: "https://example.com",
      type: EndpointType.web,
      active: true,
      currentStatus: EndpointState.UNKNOWN,
    },
  });

  await prisma.endpoint.upsert({
    where: { id: "seed-endpoint-nova-api" },
    update: {},
    create: {
      id: "seed-endpoint-nova-api",
      companyId: nova.id,
      url: "https://jsonplaceholder.typicode.com/posts/1",
      type: EndpointType.api,
      active: true,
      currentStatus: EndpointState.UNKNOWN,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
