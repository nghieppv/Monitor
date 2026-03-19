import { expect, test } from "@playwright/test";

import { expectToast, gotoReady } from "./helpers";

test("can update monitoring settings", async ({ page, request }) => {
  const settingsResponse = await request.get("/api/settings");
  expect(settingsResponse.ok()).toBeTruthy();
  const originalSettings = await settingsResponse.json();

  await gotoReady(page, "/settings");

  try {
    await page.getByTestId("settings-interval-input").fill("420");
    await page.getByTestId("settings-timeout-input").fill("9000");
    await page.getByTestId("settings-warning-threshold-input").fill("3200");
    await page.getByTestId("settings-submit-button").click();

    await expectToast(page, "Settings saved.");
  } finally {
    const restoreResponse = await request.put("/api/settings", {
      data: {
        telegramBotToken: originalSettings.telegramBotToken,
        telegramChatId: originalSettings.telegramChatId,
        intervalSeconds: originalSettings.intervalSeconds,
        timeoutMs: originalSettings.timeoutMs,
        warningThreshold: originalSettings.warningThreshold,
      },
    });

    expect(restoreResponse.ok()).toBeTruthy();
  }
});
