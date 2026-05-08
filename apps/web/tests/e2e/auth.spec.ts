import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page loads correctly", async ({ page }) => {
    await page.goto("/connexion");
    await expect(page.locator("h1")).toContainText("Kretz Club");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText("Se connecter");
  });

  test("can navigate to forgot password", async ({ page }) => {
    await page.goto("/connexion");
    await page.click('a[href="/mot-de-passe-oublie"]');
    await expect(page).toHaveURL(/mot-de-passe-oublie/);
    await expect(page.locator("h1")).toContainText("Mot de passe");
  });

  test("can navigate to signup", async ({ page }) => {
    await page.goto("/connexion");
    await page.click('a[href="/inscription"]');
    await expect(page).toHaveURL(/inscription/);
    await expect(page.locator("#inviteCode")).toBeVisible();
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/connexion");
    await page.fill("#email", "wrong@example.com");
    await page.fill("#password", "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Email ou mot de passe incorrect")).toBeVisible({ timeout: 10000 });
  });

  test("password visibility toggle works", async ({ page }) => {
    await page.goto("/connexion");
    const password = page.locator("#password");
    await password.fill("test123");
    await expect(password).toHaveAttribute("type", "password");
    // Click eye icon (button next to password input)
    await page.locator("#password").locator("..").locator("button").click();
    await expect(password).toHaveAttribute("type", "text");
  });
});
