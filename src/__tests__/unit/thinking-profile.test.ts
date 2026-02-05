/**
 * Unit tests for thinking profile utilities
 */

import { describe, it, expect } from "vitest";
import {
  generateProfileContext,
  shouldRegenerateProfile,
  type ThinkingProfile,
} from "@/lib/ai/thinking-profile";

describe("generateProfileContext", () => {
  const fullProfile: ThinkingProfile = {
    userId: "user-123",
    domains: ["SaaS", "AI/ML", "Developer Tools"],
    skills: ["TypeScript", "Product Strategy"],
    experiences: ["Led engineering team", "YC alum"],
    thinkingStyle: "analytical",
    decisionPattern: "data_driven",
    blindSpots: ["Timeline estimation", "Marketing"],
    strengths: ["Technical architecture", "Rapid prototyping"],
    recurringThemes: ["AI automation", "Developer experience"],
    values: ["User privacy", "Code quality"],
    goals: ["Launch MVP", "Get first 100 users"],
    communicationStyle: "direct_and_concise",
    preferredFeedback: "blunt",
    lastUpdated: new Date().toISOString(),
    noteCount: 25,
  };

  it("returns note about new user when noteCount is 0", () => {
    const emptyProfile: ThinkingProfile = {
      ...fullProfile,
      noteCount: 0,
    };

    const context = generateProfileContext(emptyProfile);

    expect(context).toContain("new");
    expect(context).toContain("No thinking profile available");
  });

  it("includes background section with domains and skills", () => {
    const context = generateProfileContext(fullProfile);

    expect(context).toContain("THEIR BACKGROUND");
    expect(context).toContain("SaaS");
    expect(context).toContain("TypeScript");
    expect(context).toContain("YC alum");
  });

  it("includes thinking style section", () => {
    const context = generateProfileContext(fullProfile);

    expect(context).toContain("HOW THEY THINK");
    expect(context).toContain("Analytical");
    expect(context).toContain("Technical architecture");
    expect(context).toContain("Timeline estimation");
  });

  it("includes what they care about section", () => {
    const context = generateProfileContext(fullProfile);

    expect(context).toContain("WHAT THEY CARE ABOUT");
    expect(context).toContain("AI automation");
    expect(context).toContain("User privacy");
    expect(context).toContain("Launch MVP");
  });

  it("includes preferences section", () => {
    const context = generateProfileContext(fullProfile);

    expect(context).toContain("THEIR PREFERENCES");
    expect(context).toContain("Direct And Concise");
    expect(context).toContain("blunt");
  });

  it("handles profile with empty arrays gracefully", () => {
    const sparseProfile: ThinkingProfile = {
      userId: "user-456",
      domains: [],
      skills: [],
      experiences: [],
      thinkingStyle: "creative",
      decisionPattern: "fast_mover",
      blindSpots: [],
      strengths: [],
      recurringThemes: [],
      values: [],
      goals: [],
      communicationStyle: "casual",
      preferredFeedback: "encouraging",
      lastUpdated: new Date().toISOString(),
      noteCount: 5,
    };

    // Should not throw
    expect(() => generateProfileContext(sparseProfile)).not.toThrow();

    const context = generateProfileContext(sparseProfile);
    expect(context).toContain("Creative");
    expect(context).toContain("Casual");
  });
});

describe("shouldRegenerateProfile", () => {
  const baseProfile: ThinkingProfile = {
    userId: "user-123",
    domains: ["SaaS"],
    skills: ["TypeScript"],
    experiences: [],
    thinkingStyle: "analytical",
    decisionPattern: "deliberate",
    blindSpots: [],
    strengths: [],
    recurringThemes: [],
    values: [],
    goals: [],
    communicationStyle: "direct_and_concise",
    preferredFeedback: "balanced",
    lastUpdated: new Date().toISOString(),
    noteCount: 10,
  };

  it("returns true when profile is null", () => {
    expect(shouldRegenerateProfile(null, 5)).toBe(true);
  });

  it("returns true when note count increased by 20% or more", () => {
    expect(shouldRegenerateProfile(baseProfile, 12)).toBe(true); // 20% increase
    expect(shouldRegenerateProfile(baseProfile, 15)).toBe(true); // 50% increase
    expect(shouldRegenerateProfile(baseProfile, 100)).toBe(true); // 10x increase
  });

  it("returns false when note count is below 20% threshold", () => {
    expect(shouldRegenerateProfile(baseProfile, 10)).toBe(false); // same
    expect(shouldRegenerateProfile(baseProfile, 11)).toBe(false); // 10% increase
  });

  it("returns true when profile is older than 7 days", () => {
    const oldProfile: ThinkingProfile = {
      ...baseProfile,
      lastUpdated: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    };

    expect(shouldRegenerateProfile(oldProfile, 10)).toBe(true);
  });

  it("returns false when profile is recent and note count is similar", () => {
    const recentProfile: ThinkingProfile = {
      ...baseProfile,
      lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    };

    expect(shouldRegenerateProfile(recentProfile, 10)).toBe(false);
    expect(shouldRegenerateProfile(recentProfile, 11)).toBe(false);
  });

  it("handles edge case at exactly 7 days", () => {
    const exactlySevenDays: ThinkingProfile = {
      ...baseProfile,
      lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // At exactly 7 days, should still be valid (not older than)
    expect(shouldRegenerateProfile(exactlySevenDays, 10)).toBe(false);
  });
});
