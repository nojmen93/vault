/**
 * Integration tests for GitHub functionality
 * Uses mocked fetch for GitHub API
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createMockGithubFetch,
  createMockGithubFetchRepoExists,
  mockGithubUser,
  mockRepoResponse,
} from "../mocks/github";

describe("GitHub Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getGithubUser", () => {
    it("fetches authenticated user info", async () => {
      // Mock fetch globally
      global.fetch = createMockGithubFetch();

      const { getGithubUser } = await import("@/lib/github/create-repo");

      const user = await getGithubUser("test-access-token");

      expect(user).not.toBeNull();
      expect(user?.login).toBe(mockGithubUser.login);
      expect(user?.name).toBe(mockGithubUser.name);
    });

    it("returns null when API fails", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Bad credentials" }),
      });

      const { getGithubUser } = await import("@/lib/github/create-repo");

      const user = await getGithubUser("invalid-token");

      expect(user).toBeNull();
    });
  });

  describe("createProjectRepo", () => {
    it("creates a new repository with files", async () => {
      global.fetch = createMockGithubFetch();

      const { createProjectRepo } = await import("@/lib/github/create-repo");

      const result = await createProjectRepo({
        name: "test-project",
        description: "A test project",
        isPrivate: false,
        files: {
          "README.md": "# Test Project",
          "ARCHITECTURE.md": "# Architecture",
        },
        accessToken: "test-access-token",
      });

      expect(result.success).toBe(true);
      expect(result.url).toBe(mockRepoResponse.html_url);
    });

    it("handles existing repository name", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: () =>
          Promise.resolve({
            message: "Repository creation failed. name already exists on this account",
          }),
      });

      const { createProjectRepo } = await import("@/lib/github/create-repo");

      const result = await createProjectRepo({
        name: "existing-repo",
        isPrivate: false,
        files: { "README.md": "# Test" },
        accessToken: "test-access-token",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });

    it("creates private repository", async () => {
      global.fetch = createMockGithubFetch();

      const { createProjectRepo } = await import("@/lib/github/create-repo");

      const result = await createProjectRepo({
        name: "private-project",
        isPrivate: true,
        files: { "README.md": "# Private" },
        accessToken: "test-access-token",
      });

      expect(result.success).toBe(true);
    });

    it("handles multiple files", async () => {
      global.fetch = createMockGithubFetch();

      const { createProjectRepo } = await import("@/lib/github/create-repo");

      const result = await createProjectRepo({
        name: "multi-file-project",
        isPrivate: false,
        files: {
          "README.md": "# Project",
          "ARCHITECTURE.md": "# Architecture",
          "ROADMAP.md": "# Roadmap",
          "src/index.ts": "console.log('hello')",
          "docs/guide.md": "# Guide",
        },
        accessToken: "test-access-token",
      });

      expect(result.success).toBe(true);
    });

    it("handles API errors gracefully", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const { createProjectRepo } = await import("@/lib/github/create-repo");

      const result = await createProjectRepo({
        name: "failing-project",
        isPrivate: false,
        files: { "README.md": "# Test" },
        accessToken: "test-access-token",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
