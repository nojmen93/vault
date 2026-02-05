/**
 * Mock Supabase client for testing
 * Simulates database operations without hitting a real database
 */

import { vi } from "vitest";

// Mock note data
export const mockNotes = [
  {
    id: "note-1",
    user_id: "test-user-123",
    title: "First Idea",
    encrypted_content: "encrypted-content-1",
    iv: "iv-1",
    embedding: null,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "note-2",
    user_id: "test-user-123",
    title: "Second Idea",
    encrypted_content: "encrypted-content-2",
    iv: "iv-2",
    embedding: null,
    created_at: "2024-01-16T10:00:00Z",
    updated_at: "2024-01-16T10:00:00Z",
  },
  {
    id: "note-3",
    user_id: "test-user-123",
    title: "Third Idea",
    encrypted_content: "encrypted-content-3",
    iv: "iv-3",
    embedding: null,
    created_at: "2024-01-17T10:00:00Z",
    updated_at: "2024-01-17T10:00:00Z",
  },
];

// Mock user data
export const mockUser = {
  id: "test-user-123",
  email: "test@example.com",
  github_access_token: null,
  github_username: null,
  thinking_profile: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// Mock similar notes response (from match_notes RPC)
export const mockSimilarNotesRpc = [
  {
    id: "note-2",
    user_id: "test-user-123",
    title: "Similar Idea",
    encrypted_content: "encrypted-similar",
    iv: "iv-similar",
    similarity: 0.85,
  },
  {
    id: "note-3",
    user_id: "test-user-123",
    title: "Another Similar",
    encrypted_content: "encrypted-another",
    iv: "iv-another",
    similarity: 0.72,
  },
];

// Create a more sophisticated mock Supabase client
export function createMockSupabaseClient() {
  // Track the current operation context
  let currentTable = "";
  let currentOperation = "";

  const createChain = () => {
    const chain = {
      select: vi.fn(() => chain),
      insert: vi.fn(() => chain),
      update: vi.fn(() => chain),
      delete: vi.fn(() => chain),
      upsert: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      neq: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      single: vi.fn(() => {
        // Return appropriate mock data based on table and operation
        if (currentTable === "notes") {
          if (currentOperation === "select") {
            return Promise.resolve({ data: mockNotes[0], error: null });
          }
          if (currentOperation === "insert" || currentOperation === "update") {
            return Promise.resolve({ data: mockNotes[0], error: null });
          }
        }
        if (currentTable === "users") {
          return Promise.resolve({ data: mockUser, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
      then: vi.fn((resolve) => {
        // For operations that don't end with .single()
        if (currentTable === "notes" && currentOperation === "select") {
          return resolve({ data: mockNotes, error: null });
        }
        if (currentOperation === "delete") {
          return resolve({ data: null, error: null });
        }
        return resolve({ data: mockNotes, error: null });
      }),
    };

    // Override methods to track operation
    const originalSelect = chain.select;
    chain.select = vi.fn((...args) => {
      currentOperation = "select";
      return originalSelect.apply(chain, args);
    });

    const originalInsert = chain.insert;
    chain.insert = vi.fn((...args) => {
      currentOperation = "insert";
      return originalInsert.apply(chain, args);
    });

    const originalUpdate = chain.update;
    chain.update = vi.fn((...args) => {
      currentOperation = "update";
      return originalUpdate.apply(chain, args);
    });

    const originalDelete = chain.delete;
    chain.delete = vi.fn((...args) => {
      currentOperation = "delete";
      return originalDelete.apply(chain, args);
    });

    const originalUpsert = chain.upsert;
    chain.upsert = vi.fn((...args) => {
      currentOperation = "upsert";
      return originalUpsert.apply(chain, args);
    });

    return chain;
  };

  const mockFrom = vi.fn((table: string) => {
    currentTable = table;
    currentOperation = "";
    return createChain();
  });

  const mockRpc = vi.fn((funcName: string) => {
    if (funcName === "match_notes") {
      return Promise.resolve({ data: mockSimilarNotesRpc, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  });

  return {
    from: mockFrom,
    rpc: mockRpc,
  };
}
