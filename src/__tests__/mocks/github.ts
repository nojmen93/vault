/**
 * Mock GitHub API responses for testing
 */

import { vi } from "vitest";

// Mock GitHub user
export const mockGithubUser = {
  login: "testuser",
  name: "Test User",
  avatar_url: "https://avatars.githubusercontent.com/u/12345",
  id: 12345,
};

// Mock repository response
export const mockRepoResponse = {
  id: 123456789,
  name: "test-project",
  full_name: "testuser/test-project",
  html_url: "https://github.com/testuser/test-project",
  owner: {
    login: "testuser",
  },
  default_branch: "main",
  private: false,
};

// Mock blob response
export const mockBlobResponse = {
  sha: "abc123def456",
  url: "https://api.github.com/repos/testuser/test-project/git/blobs/abc123def456",
};

// Mock tree response
export const mockTreeResponse = {
  sha: "tree123",
  url: "https://api.github.com/repos/testuser/test-project/git/trees/tree123",
};

// Mock commit response
export const mockCommitResponse = {
  sha: "commit123",
  url: "https://api.github.com/repos/testuser/test-project/git/commits/commit123",
};

// Mock ref response
export const mockRefResponse = {
  ref: "refs/heads/main",
  url: "https://api.github.com/repos/testuser/test-project/git/refs/heads/main",
  object: {
    sha: "commit123",
    type: "commit",
  },
};

// Create mock fetch for GitHub API
export function createMockGithubFetch() {
  return vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    const method = options?.method || "GET";

    // User endpoint
    if (url === "https://api.github.com/user" && method === "GET") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockGithubUser),
      });
    }

    // Create repo endpoint
    if (url === "https://api.github.com/user/repos" && method === "POST") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRepoResponse),
      });
    }

    // Create blob endpoint
    if (url.includes("/git/blobs") && method === "POST") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockBlobResponse),
      });
    }

    // Create tree endpoint
    if (url.includes("/git/trees") && method === "POST") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTreeResponse),
      });
    }

    // Create commit endpoint
    if (url.includes("/git/commits") && method === "POST") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCommitResponse),
      });
    }

    // Create ref endpoint
    if (url.includes("/git/refs") && method === "POST") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRefResponse),
      });
    }

    // Default: 404
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: "Not Found" }),
    });
  });
}

// Create mock for repo already exists error
export function createMockGithubFetchRepoExists() {
  return vi.fn().mockImplementation((url: string, options?: RequestInit) => {
    const method = options?.method || "GET";

    if (url === "https://api.github.com/user/repos" && method === "POST") {
      return Promise.resolve({
        ok: false,
        status: 422,
        json: () =>
          Promise.resolve({
            message: "Repository creation failed.",
            errors: [{ message: "name already exists on this account" }],
          }),
      });
    }

    return createMockGithubFetch()(url, options);
  });
}

// Create mock for API failure
export function createMockGithubFetchError(errorMessage: string = "API Error") {
  return vi.fn().mockRejectedValue(new Error(errorMessage));
}
