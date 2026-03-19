import { expect, test } from "@playwright/test";

import { gotoReady } from "./helpers";

test("dashboard filters endpoints by company and status", async ({ page }) => {
  await gotoReady(page, "/");

  const companyFilter = page.getByTestId("dashboard-company-filter");
  const companyOptions = await companyFilter.locator("option").allTextContents();
  const targetCompany = companyOptions.find((option) => option !== "All companies");

  expect(targetCompany).toBeTruthy();

  await companyFilter.selectOption({ label: targetCompany! });
  await expect(page.getByTestId("dashboard-table")).toContainText(targetCompany!);

  await page.getByTestId("dashboard-status-filter").selectOption("ALL");
  await expect(page.getByTestId("dashboard-company-filter")).toHaveValue(await companyFilter.inputValue());
});
