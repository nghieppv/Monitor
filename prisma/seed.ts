import { PrismaClient } from "@prisma/client";

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
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Acme Logistics",
      taxCode: "TAX-ACME-01",
      address: "12 Harbor View, Singapore",
      note: "Core customer services",
    },
  });

  const nova = await prisma.company.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Nova Finance",
      taxCode: "TAX-NOVA-18",
      address: "88 Market Street, Hanoi",
      note: "Public API surfaces",
    },
  });

  await prisma.endpoint.upsert({
    where: { id: "00000000-0000-0000-0000-000000000011" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000011",
      companyId: acme.id,
      url: "https://example.com",
      type: "web",
      active: true,
      currentStatus: "UNKNOWN",
    },
  });

  await prisma.endpoint.upsert({
    where: { id: "00000000-0000-0000-0000-000000000012" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000012",
      companyId: nova.id,
      url: "https://jsonplaceholder.typicode.com/posts/1",
      type: "api",
      active: true,
      currentStatus: "UNKNOWN",
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
