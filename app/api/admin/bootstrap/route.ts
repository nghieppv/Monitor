import { fail, ok, handleRouteError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { hasValidCronSecret } from "@/lib/runtime";

async function ensureEnums() {
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EndpointType') THEN
        CREATE TYPE "EndpointType" AS ENUM ('web', 'api');
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EndpointState') THEN
        CREATE TYPE "EndpointState" AS ENUM ('OK', 'WARNING', 'DOWN', 'UNKNOWN');
      END IF;
    END $$;
  `);
}

async function ensureTables() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Company" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "taxCode" TEXT,
      "address" TEXT,
      "note" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Endpoint" (
      "id" TEXT PRIMARY KEY,
      "companyId" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "type" "EndpointType" NOT NULL,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "currentStatus" "EndpointState" NOT NULL DEFAULT 'UNKNOWN',
      "lastResponseTime" INTEGER,
      "lastCheckedAt" TIMESTAMP(3),
      "lastHttpCode" INTEGER,
      "lastError" TEXT,
      "lastAlertState" "EndpointState",
      "lastNotifiedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Endpoint_companyId_fkey"
        FOREIGN KEY ("companyId") REFERENCES "Company"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "EndpointStatus" (
      "id" TEXT PRIMARY KEY,
      "endpointId" TEXT NOT NULL,
      "status" "EndpointState" NOT NULL,
      "responseTime" INTEGER,
      "httpCode" INTEGER,
      "message" TEXT,
      "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "EndpointStatus_endpointId_fkey"
        FOREIGN KEY ("endpointId") REFERENCES "Endpoint"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Settings" (
      "id" TEXT PRIMARY KEY DEFAULT 'default',
      "telegramBotToken" TEXT,
      "telegramChatId" TEXT,
      "intervalSeconds" INTEGER NOT NULL DEFAULT 300,
      "timeoutMs" INTEGER NOT NULL DEFAULT 10000,
      "warningThreshold" INTEGER NOT NULL DEFAULT 2500,
      "lastMonitoringAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Endpoint_companyId_idx" ON "Endpoint" ("companyId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EndpointStatus_endpointId_idx" ON "EndpointStatus" ("endpointId")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EndpointStatus_checkedAt_idx" ON "EndpointStatus" ("checkedAt")`);
}

async function seedDefaults() {
  await prisma.$executeRawUnsafe(`
    INSERT INTO "Settings" ("id", "intervalSeconds", "timeoutMs", "warningThreshold")
    VALUES ('default', 300, 10000, 2500)
    ON CONFLICT ("id") DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "Company" ("id", "name", "taxCode", "address", "note")
    VALUES
      ('seed-company-acme', 'Acme Logistics', 'TAX-ACME-01', '12 Harbor View, Singapore', 'Core customer services'),
      ('seed-company-nova', 'Nova Finance', 'TAX-NOVA-18', '88 Market Street, Hanoi', 'Public API surfaces')
    ON CONFLICT ("id") DO NOTHING
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "Endpoint" ("id", "companyId", "url", "type", "active", "currentStatus")
    VALUES
      ('seed-endpoint-acme-web', 'seed-company-acme', 'https://example.com', 'web', true, 'UNKNOWN'),
      ('seed-endpoint-nova-api', 'seed-company-nova', 'https://jsonplaceholder.typicode.com/posts/1', 'api', true, 'UNKNOWN')
    ON CONFLICT ("id") DO NOTHING
  `);
}

export async function POST(request: Request) {
  try {
    if (!hasValidCronSecret(request)) {
      return fail("Unauthorized", 401);
    }

    await ensureEnums();
    await ensureTables();
    await seedDefaults();

    return ok({ success: true, initialized: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
