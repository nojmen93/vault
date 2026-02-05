/**
 * Integration tests for incubator actions
 * Uses mocked Anthropic API
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockIncubatorResponse, mockThinkingProfile } from "../mocks/ai";

describe("Incubator Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("analyzeIdeas", () => {
    it("analyzes ideas and returns structured response", async () => {
      const { analyzeIdeas } = await import("@/lib/ai/incubator");

      const ideas = [
        "Build a note-taking app with AI",
        "Add semantic search to find related notes",
        "Use encryption for privacy",
      ];

      const result = await analyzeIdeas(ideas);

      expect(result).toHaveProperty("analysis");
      expect(result).toHaveProperty("connections");
      expect(result).toHaveProperty("suggestions");
      expect(Array.isArray(result.connections)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it("includes personalized insights when profile context provided", async () => {
      const { analyzeIdeas } = await import("@/lib/ai/incubator");
      const { generateProfileContext } = await import("@/lib/ai/thinking-profile");

      const ideas = ["Build a developer tool"];
      const profileContext = generateProfileContext(mockThinkingProfile);

      const result = await analyzeIdeas(ideas, profileContext);

      // Mock returns personalizedInsights
      expect(result).toHaveProperty("personalizedInsights");
      if (result.personalizedInsights) {
        expect(Array.isArray(result.personalizedInsights)).toBe(true);
      }
    });

    it("handles single idea", async () => {
      const { analyzeIdeas } = await import("@/lib/ai/incubator");

      const ideas = ["Just one idea"];

      const result = await analyzeIdeas(ideas);

      expect(result).toHaveProperty("analysis");
    });

    it("handles many ideas", async () => {
      const { analyzeIdeas } = await import("@/lib/ai/incubator");

      const ideas = Array(10)
        .fill(null)
        .map((_, i) => `Idea number ${i + 1}`);

      const result = await analyzeIdeas(ideas);

      expect(result).toHaveProperty("analysis");
    });
  });
});

describe("Thinking Profile Generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateThinkingProfile", () => {
    it("returns default profile when no notes provided", async () => {
      const { generateThinkingProfile } = await import("@/lib/ai/thinking-profile");

      const result = await generateThinkingProfile("user-123", []);

      expect(result.userId).toBe("user-123");
      expect(result.noteCount).toBe(0);
      expect(result.thinkingStyle).toBe("analytical");
    });

    it("generates profile from notes", async () => {
      const { generateThinkingProfile } = await import("@/lib/ai/thinking-profile");

      const notes = [
        {
          title: "SaaS Idea",
          content: "Build a B2B SaaS product for developers",
          createdAt: "2024-01-15T10:00:00Z",
        },
        {
          title: "Tech Stack",
          content: "Use TypeScript, Next.js, and PostgreSQL",
          createdAt: "2024-01-16T10:00:00Z",
        },
      ];

      const result = await generateThinkingProfile("user-123", notes);

      expect(result.userId).toBe("user-123");
      expect(result.noteCount).toBe(2);
      expect(result.lastUpdated).toBeDefined();
    });

    it("handles notes without titles", async () => {
      const { generateThinkingProfile } = await import("@/lib/ai/thinking-profile");

      const notes = [
        {
          title: null,
          content: "A note without a title",
          createdAt: "2024-01-15T10:00:00Z",
        },
      ];

      const result = await generateThinkingProfile("user-123", notes);

      expect(result.userId).toBe("user-123");
    });

    it("limits notes to prevent token overflow", async () => {
      const { generateThinkingProfile } = await import("@/lib/ai/thinking-profile");

      // Create more than 50 notes
      const notes = Array(60)
        .fill(null)
        .map((_, i) => ({
          title: `Note ${i}`,
          content: "Content ".repeat(100),
          createdAt: new Date().toISOString(),
        }));

      const result = await generateThinkingProfile("user-123", notes);

      // Should still complete without error
      expect(result.userId).toBe("user-123");
    });
  });
});
