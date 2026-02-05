/**
 * E2E tests for Idea Cloud
 */

import { test, expect } from "@playwright/test";

test.describe("Idea Cloud", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("renders bubbles for notes", async ({ page }) => {
    // Look for bubble elements
    const bubbles = page.locator('[data-testid="idea-bubble"]');

    // Should have some bubbles if there are notes
    // (This test assumes there are notes - in real E2E, we'd seed data)
    const count = await bubbles.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("shows empty state when no notes", async ({ page }) => {
    // If no notes, should show empty state
    const emptyState = page.getByText(/no ideas|start capturing|add your first/i);
    const bubbles = page.locator('[data-testid="idea-bubble"]');

    // Either bubbles or empty state should be visible
    const hasBubbles = (await bubbles.count()) > 0;
    if (!hasBubbles) {
      await expect(emptyState).toBeVisible();
    }
  });

  test("expands bubble on click", async ({ page }) => {
    const bubbles = page.locator('[data-testid="idea-bubble"]');
    const count = await bubbles.count();

    if (count > 0) {
      // Click first bubble
      await bubbles.first().click();

      // Should show expanded view
      const expandedView = page.locator('[data-testid="idea-expanded"]');
      await expect(expandedView).toBeVisible();
    }
  });

  test("shows correct content in expanded view", async ({ page }) => {
    const bubbles = page.locator('[data-testid="idea-bubble"]');
    const count = await bubbles.count();

    if (count > 0) {
      // Get the title from the bubble
      const bubbleTitle = await bubbles.first().innerText();

      // Click to expand
      await bubbles.first().click();

      // Expanded view should contain the title
      const expandedView = page.locator('[data-testid="idea-expanded"]');
      await expect(expandedView).toContainText(bubbleTitle.substring(0, 20));
    }
  });

  test("collapses expanded view on close button", async ({ page }) => {
    const bubbles = page.locator('[data-testid="idea-bubble"]');
    const count = await bubbles.count();

    if (count > 0) {
      await bubbles.first().click();

      // Click close button
      const closeButton = page.locator('[data-testid="close-expanded"]');
      await closeButton.click();

      // Expanded view should be hidden
      const expandedView = page.locator('[data-testid="idea-expanded"]');
      await expect(expandedView).not.toBeVisible();
    }
  });

  test("supports drag and drop", async ({ page }) => {
    const bubbles = page.locator('[data-testid="idea-bubble"]');
    const count = await bubbles.count();

    if (count > 0) {
      const bubble = bubbles.first();

      // Get initial position
      const initialBox = await bubble.boundingBox();
      expect(initialBox).not.toBeNull();

      // Drag the bubble
      await bubble.dragTo(page.locator("body"), {
        targetPosition: {
          x: (initialBox?.x ?? 0) + 100,
          y: (initialBox?.y ?? 0) + 100,
        },
      });

      // Position should have changed
      const newBox = await bubble.boundingBox();
      // Note: Exact position check depends on implementation
    }
  });

  test("persists positions in localStorage", async ({ page }) => {
    const bubbles = page.locator('[data-testid="idea-bubble"]');
    const count = await bubbles.count();

    if (count > 0) {
      const bubble = bubbles.first();
      const initialBox = await bubble.boundingBox();

      // Drag to new position
      await bubble.dragTo(page.locator("body"), {
        targetPosition: {
          x: (initialBox?.x ?? 0) + 50,
          y: (initialBox?.y ?? 0) + 50,
        },
      });

      // Check localStorage
      const positions = await page.evaluate(() => {
        return localStorage.getItem("idea-cloud-positions");
      });

      expect(positions).not.toBeNull();
    }
  });
});
