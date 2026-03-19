import { expect, test } from "@playwright/test";

import { cleanupTestData, gotoReady, uniqueName } from "./helpers";

test("can create, edit, and delete a company and endpoint", async ({ page, baseURL }) => {
  const prefix = uniqueName("pw-e2e");
  const companyName = `${prefix}-company`;
  const updatedCompanyName = `${companyName}-edited`;
  const endpointUrl = `https://example.com/${prefix}-health`;

  if (!baseURL) {
    throw new Error("baseURL is required for cleanup");
  }

  await cleanupTestData(baseURL, prefix);

  try {
    await gotoReady(page, "/companies");
    await page.getByTestId("company-name-input").fill(companyName);
    await page.getByTestId("company-tax-code-input").fill("PW-TAX-01");
    await page.getByTestId("company-address-input").fill("Playwright Street");
    await page.getByTestId("company-note-input").fill(`Created by ${prefix}`);
    await page.getByTestId("company-submit-button").click();

    const companyRow = page.locator("tr", { hasText: companyName });
    await expect(companyRow).toBeVisible();

    await companyRow.getByTestId("company-edit-button").click();
    await page.getByTestId("company-name-input").fill(updatedCompanyName);
    await page.getByTestId("company-submit-button").click();
    await expect(page.locator("tr", { hasText: updatedCompanyName })).toBeVisible();

    await gotoReady(page, "/endpoints");
    await page.getByTestId("endpoint-company-select").selectOption({ label: updatedCompanyName });
    await page.getByTestId("endpoint-url-input").fill(endpointUrl);
    await page.getByTestId("endpoint-type-select").selectOption("web");
    await page.getByTestId("endpoint-active-select").selectOption("true");
    await page.getByTestId("endpoint-submit-button").click();

    const endpointRow = page.locator("tr", { hasText: endpointUrl });
    await expect(endpointRow).toBeVisible();

    await endpointRow.getByTestId("endpoint-delete-button").click();
    await expect(endpointRow).toHaveCount(0);

    await gotoReady(page, "/companies");
    const updatedCompanyRow = page.locator("tr", { hasText: updatedCompanyName });
    await updatedCompanyRow.getByTestId("company-delete-button").click();
    await expect(updatedCompanyRow).toHaveCount(0);
  } finally {
    await cleanupTestData(baseURL, prefix);
  }
});
