import { expect, type Page } from "@playwright/test";

const cleanupSecret = process.env.PLAYWRIGHT_CLEANUP_SECRET ?? process.env.CRON_SECRET;

export function uniqueName(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function gotoReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
}

export async function expectToast(page: Page, text: string) {
  await expect(page.getByTestId("form-message")).toContainText(text);
}

export async function cleanupTestData(baseURL: string, prefix: string) {
  if (!cleanupSecret) {
    throw new Error("PLAYWRIGHT_CLEANUP_SECRET or CRON_SECRET is required for cleanup");
  }

  const response = await fetch(`${baseURL}/api/admin/test-cleanup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cleanupSecret}`,
    },
    body: JSON.stringify({ prefix }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Cleanup failed: ${message}`);
  }
}
