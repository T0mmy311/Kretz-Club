import { test, expect } from "@playwright/test";

test.describe("Messagerie (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    // Login as Thomas
    await page.goto("/connexion");
    await page.fill("#email", "thomas.jean28@outlook.fr");
    await page.fill("#password", "Erokspeiti28@");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/messagerie/, { timeout: 15000 });
  });

  test("displays channel list", async ({ page }) => {
    await expect(page.locator("text=Le Cercle")).toBeVisible();
    await expect(page.locator("text=Le Grand Salon")).toBeVisible();
  });

  test("can navigate to a channel", async ({ page }) => {
    await page.click("text=Discussions");
    await expect(page).toHaveURL(/messagerie\/[^/]+$/);
  });

  test("sidebar shows all main sections", async ({ page }) => {
    await expect(page.locator("text=Messagerie")).toBeVisible();
    await expect(page.locator("text=Investissements")).toBeVisible();
    await expect(page.locator("text=Annuaire")).toBeVisible();
  });
});
