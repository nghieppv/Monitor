import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Name is required"),
  tax_code: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export const endpointSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  url: z.string().url("A valid URL is required"),
  type: z.string(),
  active: z.boolean().default(true),
});

export const settingsSchema = z.object({
  telegramBotToken: z.string().optional().nullable(),
  telegramChatId: z.string().optional().nullable(),
  intervalSeconds: z.coerce.number().int().min(30).max(86400),
  timeoutMs: z.coerce.number().int().min(1000).max(60000),
  warningThreshold: z.coerce.number().int().min(200).max(60000),
});

export const monitoringFilterSchema = z.object({
  status: z.enum(["ALL", "OK", "WARNING", "DOWN", "UNKNOWN"]).optional(),
  companyId: z.string().optional(),
});
