/**
 * Mock Clerk authentication for testing
 */

import { vi } from "vitest";

// Mock authenticated user
export const mockAuthenticatedUser = {
  userId: "test-user-123",
};

// Mock unauthenticated state
export const mockUnauthenticated = {
  userId: null,
};

// Mock Clerk user object
export const mockClerkUser = {
  id: "test-user-123",
  emailAddresses: [
    {
      emailAddress: "test@example.com",
    },
  ],
  firstName: "Test",
  lastName: "User",
  fullName: "Test User",
  imageUrl: "https://example.com/avatar.jpg",
};

// Create mock auth function
export function createMockAuth(authenticated: boolean = true) {
  return vi.fn().mockResolvedValue(
    authenticated ? mockAuthenticatedUser : mockUnauthenticated
  );
}

// Create mock currentUser function
export function createMockCurrentUser(authenticated: boolean = true) {
  return vi.fn().mockResolvedValue(authenticated ? mockClerkUser : null);
}

// Create mock useUser hook return value
export function createMockUseUser(authenticated: boolean = true) {
  return {
    isLoaded: true,
    isSignedIn: authenticated,
    user: authenticated ? mockClerkUser : null,
  };
}

// Create mock useAuth hook return value
export function createMockUseAuth(authenticated: boolean = true) {
  return {
    isLoaded: true,
    isSignedIn: authenticated,
    userId: authenticated ? mockAuthenticatedUser.userId : null,
    sessionId: authenticated ? "session-123" : null,
    getToken: vi.fn().mockResolvedValue(authenticated ? "mock-token" : null),
  };
}

// Helper to setup Clerk mocks
export function setupClerkMocks(authenticated: boolean = true) {
  return {
    auth: createMockAuth(authenticated),
    currentUser: createMockCurrentUser(authenticated),
    useUser: createMockUseUser(authenticated),
    useAuth: createMockUseAuth(authenticated),
  };
}
