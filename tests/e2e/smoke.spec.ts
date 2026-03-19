import { expect, test } from "@playwright/test";

import { gotoReady } from "./helpers";

test("@smoke dashboard renders summary and table", async ({ page }) => {
  await gotoReady(page, "/");

  await expect(page.getByRole("heading", { name: "Health overview" })).toBeVisible();
  await expect(page.getByTestId("summary-total")).toBeVisible();
  await expect(page.getByTestId("dashboard-table")).toBeVisible();
});

test("@smoke history renders chart and checks table", async ({ page }) => {
  await gotoReady(page, "/history");

  await expect(page.getByRole("heading", { name: "Check history" })).toBeVisible();
  await expect(page.getByTestId("uptime-chart")).toBeVisible();
  await expect(page.getByTestId("recent-checks-table")).toBeVisible();
});

test("@smoke settings API and page are available", async ({ page, request }) => {
  const response = await request.get("/api/settings");
  expect(response.ok()).toBeTruthy();

  await gotoReady(page, "/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByTestId("settings-form")).toBeVisible();
});
