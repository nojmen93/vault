/**
 * E2E tests for full user flow
 */

import { test, expect } from "@playwright/test";

test.describe("Full User Flow", () => {
  test("landing page loads and has call to action", async ({ page }) => {
    await page.goto("/");

    // Should show landing page content
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Should have sign up / get started button
    const ctaButton = page.getByRole("link", { name: /get started|sign up|try/i });
    await expect(ctaButton).toBeVisible();
  });

  test("redirects to sign-in when accessing protected route", async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto("/dashboard");

    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
  });

  test("sign-in page loads", async ({ page }) => {
    await page.goto("/sign-in");

    // Should show sign-in form
    await expect(page.getByText(/sign in|log in/i)).toBeVisible();
  });

  test("sign-up page loads", async ({ page }) => {
    await page.goto("/sign-up");

    // Should show sign-up form
    await expect(page.getByText(/sign up|create account/i)).toBeVisible();
  });
});

test.describe("Authenticated User Flow", () => {
  // These tests would need auth bypass or test credentials

  test.skip("complete flow: capture -> analyze -> save", async ({ page }) => {
    // This test requires authentication
    await page.goto("/dashboard");

    // 1. Quick capture a note
    await page.keyboard.press("Meta+k");
    const input = page.getByRole("textbox");
    await input.fill("New startup idea: AI-powered todo list that learns your habits");
    await page.keyboard.press("Meta+Enter");

    // Wait for save
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });

    // 2. Open incubator
    const incubatorTrigger = page.getByRole("button", { name: /incubator/i });
    await incubatorTrigger.click();

    // 3. Analyze the idea
    const ideaInput = page.getByPlaceholder(/idea/i);
    await ideaInput.fill("AI todo list that adapts to user behavior");

    const analyzeButton = page.getByRole("button", { name: /analyze/i });
    await analyzeButton.click();

    // 4. Wait for analysis
    await page.waitForSelector('[data-testid="analysis-result"]', { timeout: 30000 });

    // 5. Verify analysis shows
    await expect(page.getByText(/analysis/i)).toBeVisible();
  });
});

test.describe("Error Handling", () => {
  test("shows error page for 404", async ({ page }) => {
    await page.goto("/nonexistent-page-12345");

    // Should show 404 or not found
    await expect(page.getByText(/not found|404/i)).toBeVisible();
  });

  test("handles network errors gracefully", async ({ page }) => {
    // Block API requests
    await page.route("**/api/**", (route) => route.abort());

    await page.goto("/dashboard");

    // Should not crash - either redirect to login or show error
    await expect(page).not.toHaveURL(/undefined|null/);
  });
});

test.describe("Responsive Design", () => {
  test("works on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    // Should still show main content
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("works on tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("works on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test("landing page has proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    const h1 = await page.locator("h1").count();
    expect(h1).toBeGreaterThanOrEqual(1);
  });

  test("interactive elements are keyboard accessible", async ({ page }) => {
    await page.goto("/");

    // Tab through page
    await page.keyboard.press("Tab");

    // Should focus on first interactive element
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(["A", "BUTTON", "INPUT", "TEXTAREA"]).toContain(focused);
  });

  test("buttons have accessible names", async ({ page }) => {
    await page.goto("/");

    const buttons = page.getByRole("button");
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const name = await button.getAttribute("aria-label");
      const text = await button.innerText();

      // Button should have either aria-label or visible text
      expect(name || text).toBeTruthy();
    }
  });
});
