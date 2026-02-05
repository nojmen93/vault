/**
 * E2E tests for Incubator Mode
 */

import { test, expect } from "@playwright/test";

test.describe("Incubator Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("shows incubator panel", async ({ page }) => {
    // Look for incubator trigger or panel
    const incubatorTrigger = page.getByRole("button", { name: /incubator|analyze/i });
    await expect(incubatorTrigger).toBeVisible();
  });

  test("can select ideas for analysis", async ({ page }) => {
    // Open incubator
    const incubatorTrigger = page.getByRole("button", { name: /incubator|analyze/i });
    await incubatorTrigger.click();

    // Should show selection interface
    const selectionArea = page.locator('[data-testid="idea-selection"]');
    await expect(selectionArea).toBeVisible({ timeout: 5000 });
  });

  test("allows typing new idea for analysis", async ({ page }) => {
    const incubatorTrigger = page.getByRole("button", { name: /incubator|analyze/i });
    await incubatorTrigger.click();

    // Look for textarea to type new idea
    const ideaInput = page.getByPlaceholder(/idea|thought|describe/i);
    await ideaInput.fill("My new startup idea about AI-powered note taking");

    await expect(ideaInput).toHaveValue(/AI-powered/);
  });

  test("shows loading state during analysis", async ({ page }) => {
    const incubatorTrigger = page.getByRole("button", { name: /incubator|analyze/i });
    await incubatorTrigger.click();

    // Type an idea
    const ideaInput = page.getByPlaceholder(/idea|thought|describe/i);
    await ideaInput.fill("Test idea for analysis");

    // Click analyze
    const analyzeButton = page.getByRole("button", { name: /analyze|start/i });
    await analyzeButton.click();

    // Should show loading indicator
    const loading = page.locator('[data-testid="analysis-loading"]');
    await expect(loading).toBeVisible({ timeout: 2000 });
  });

  test("displays analysis results", async ({ page }) => {
    const incubatorTrigger = page.getByRole("button", { name: /incubator|analyze/i });
    await incubatorTrigger.click();

    const ideaInput = page.getByPlaceholder(/idea|thought|describe/i);
    await ideaInput.fill("Build a privacy-first note app with AI features");

    const analyzeButton = page.getByRole("button", { name: /analyze|start/i });
    await analyzeButton.click();

    // Wait for analysis to complete
    const analysisResult = page.locator('[data-testid="analysis-result"]');
    await expect(analysisResult).toBeVisible({ timeout: 30000 });

    // Should show key sections
    await expect(page.getByText(/analysis|feasibility|market/i)).toBeVisible();
  });

  test("shows connections between ideas", async ({ page }) => {
    const incubatorTrigger = page.getByRole("button", { name: /incubator|analyze/i });
    await incubatorTrigger.click();

    const ideaInput = page.getByPlaceholder(/idea|thought|describe/i);
    await ideaInput.fill("Multiple related ideas for analysis");

    const analyzeButton = page.getByRole("button", { name: /analyze|start/i });
    await analyzeButton.click();

    // Wait for analysis
    await page.waitForSelector('[data-testid="analysis-result"]', { timeout: 30000 });

    // Should show connections section
    const connections = page.getByText(/connections|related|links/i);
    await expect(connections).toBeVisible();
  });

  test("shows suggestions", async ({ page }) => {
    const incubatorTrigger = page.getByRole("button", { name: /incubator|analyze/i });
    await incubatorTrigger.click();

    const ideaInput = page.getByPlaceholder(/idea|thought|describe/i);
    await ideaInput.fill("Idea needing suggestions");

    const analyzeButton = page.getByRole("button", { name: /analyze|start/i });
    await analyzeButton.click();

    await page.waitForSelector('[data-testid="analysis-result"]', { timeout: 30000 });

    // Should show suggestions
    const suggestions = page.getByText(/suggestions|next steps|recommendations/i);
    await expect(suggestions).toBeVisible();
  });

  test("can save analysis as note", async ({ page }) => {
    const incubatorTrigger = page.getByRole("button", { name: /incubator|analyze/i });
    await incubatorTrigger.click();

    const ideaInput = page.getByPlaceholder(/idea|thought|describe/i);
    await ideaInput.fill("Idea to save");

    const analyzeButton = page.getByRole("button", { name: /analyze|start/i });
    await analyzeButton.click();

    await page.waitForSelector('[data-testid="analysis-result"]', { timeout: 30000 });

    // Click save button
    const saveButton = page.getByRole("button", { name: /save|keep/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();

      // Should show success message
      const success = page.getByText(/saved|created/i);
      await expect(success).toBeVisible({ timeout: 5000 });
    }
  });
});
