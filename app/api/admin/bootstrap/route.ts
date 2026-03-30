import { fail, ok } from "@/lib/api";
import { query } from "@/lib/mssql";
import { hasValidCronSecret } from "@/lib/runtime";

export async function POST(request: Request) {
  try {
    if (!hasValidCronSecret(request)) {
      return fail("Unauthorized", 401);
    }
    // Create MSSQL tables if not exist (raw SQL)
    await query(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Company')
    BEGIN
      CREATE TABLE Company (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        taxCode NVARCHAR(100) NULL,
        address NVARCHAR(255) NULL,
        note NVARCHAR(MAX) NULL,
        createdAt DATETIME2 DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
      )
    END`);
    await query(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Endpoint')
    BEGIN
      CREATE TABLE Endpoint (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        companyId UNIQUEIDENTIFIER NOT NULL,
        url NVARCHAR(2048) NOT NULL,
        type NVARCHAR(50) NOT NULL,
        active BIT NOT NULL DEFAULT 1,
        currentStatus NVARCHAR(50) NOT NULL DEFAULT 'UNKNOWN',
        lastResponseTime INT NULL,
        lastCheckedAt DATETIME2 NULL,
        lastHttpCode INT NULL,
        lastError NVARCHAR(MAX) NULL,
        lastAlertState NVARCHAR(50) NULL,
        lastNotifiedAt DATETIME2 NULL,
        createdAt DATETIME2 DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Endpoint_Company FOREIGN KEY (companyId) REFERENCES Company(id) ON DELETE CASCADE
      )
    END`);
    await query(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EndpointStatus')
    BEGIN
      CREATE TABLE EndpointStatus (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        endpointId UNIQUEIDENTIFIER NOT NULL,
        status NVARCHAR(50) NOT NULL,
        responseTime INT NULL,
        httpCode INT NULL,
        message NVARCHAR(MAX) NULL,
        checkedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_EndpointStatus_Endpoint FOREIGN KEY (endpointId) REFERENCES Endpoint(id) ON DELETE CASCADE
      )
    END`);
    await query(`IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Settings')
    BEGIN
      CREATE TABLE Settings (
        id NVARCHAR(50) PRIMARY KEY DEFAULT 'default',
        telegramBotToken NVARCHAR(255) NULL,
        telegramChatId NVARCHAR(255) NULL,
        intervalSeconds INT NOT NULL DEFAULT 300,
        timeoutMs INT NOT NULL DEFAULT 10000,
        warningThreshold INT NOT NULL DEFAULT 2500,
        lastMonitoringAt DATETIME2 NULL,
        createdAt DATETIME2 DEFAULT SYSUTCDATETIME(),
        updatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
      )
    END`);
    // Seed default
    await query(`IF NOT EXISTS (SELECT 1 FROM Settings WHERE id = 'default')
      INSERT INTO Settings (id, intervalSeconds, timeoutMs, warningThreshold) VALUES ('default', 300, 10000, 2500)
    `);
    return ok({ success: true, initialized: true });
  } catch (error) {
    return fail("Internal server error");
  }
}
