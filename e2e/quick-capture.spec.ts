/**
 * E2E tests for Quick Capture (Cmd+K)
 */

import { test, expect } from "@playwright/test";

test.describe("Quick Capture Modal", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard (will need auth bypass in real tests)
    await page.goto("/dashboard");
  });

  test("opens modal on Cmd+K / Ctrl+K", async ({ page }) => {
    // Press Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    await page.keyboard.press("Meta+k");

    // Check if modal is visible
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
  });

  test("opens modal on Ctrl+K", async ({ page }) => {
    await page.keyboard.press("Control+k");

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
  });

  test("closes modal on Escape", async ({ page }) => {
    // Open modal
    await page.keyboard.press("Meta+k");
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // Press Escape
    await page.keyboard.press("Escape");

    // Modal should be hidden
    await expect(modal).not.toBeVisible();
  });

  test("auto-focuses input when opened", async ({ page }) => {
    await page.keyboard.press("Meta+k");

    // The textarea/input should be focused
    const input = page.getByRole("textbox");
    await expect(input).toBeFocused();
  });

  test("does not submit empty input", async ({ page }) => {
    await page.keyboard.press("Meta+k");

    // Try to submit empty form
    await page.keyboard.press("Meta+Enter");

    // Modal should still be visible (not closed)
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
  });

  test("submits note and closes modal", async ({ page }) => {
    await page.keyboard.press("Meta+k");

    // Type some content
    const input = page.getByRole("textbox");
    await input.fill("Quick capture test note");

    // Submit with Cmd+Enter
    await page.keyboard.press("Meta+Enter");

    // Modal should close
    const modal = page.getByRole("dialog");
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });

  test("shows success toast after save", async ({ page }) => {
    await page.keyboard.press("Meta+k");

    const input = page.getByRole("textbox");
    await input.fill("Note for toast test");

    await page.keyboard.press("Meta+Enter");

    // Look for success toast
    const toast = page.getByText(/saved|captured/i);
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test("clears input after successful save", async ({ page }) => {
    await page.keyboard.press("Meta+k");

    const input = page.getByRole("textbox");
    await input.fill("First note");
    await page.keyboard.press("Meta+Enter");

    // Wait for modal to close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });

    // Open modal again
    await page.keyboard.press("Meta+k");

    // Input should be empty
    const newInput = page.getByRole("textbox");
    await expect(newInput).toHaveValue("");
  });
});
