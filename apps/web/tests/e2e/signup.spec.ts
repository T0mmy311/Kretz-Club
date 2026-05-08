import { test, expect } from "@playwright/test";

test.describe("Signup with invitation code", () => {
  test("requires invitation code", async ({ page }) => {
    await page.goto("/inscription");
    await page.fill("#firstName", "Test");
    await page.fill("#lastName", "User");
    await page.fill("#email", `test-${Date.now()}@example.com`);
    await page.fill("#password", "Password123");
    // Don't fill invite code
    await page.click('button[type="submit"]');
    // Form should not submit (HTML5 validation)
    await expect(page).toHaveURL(/inscription/);
  });

  test("rejects invalid invitation code", async ({ page }) => {
    await page.goto("/inscription");
    await page.fill("#inviteCode", "INVALIDCODE");
    await page.fill("#firstName", "Test");
    await page.fill("#lastName", "User");
    await page.fill("#email", `test-${Date.now()}@example.com`);
    await page.fill("#password", "Password123");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=invalide")).toBeVisible({ timeout: 10000 });
  });
});
