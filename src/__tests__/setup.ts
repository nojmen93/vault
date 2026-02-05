/**
 * Vitest setup file
 * Runs before all tests to configure mocks and global setup
 */

import { vi, beforeAll, afterEach, afterAll } from "vitest";
import { mockEmbedding, mockIncubatorResponse, mockThinkingProfile } from "./mocks/ai";
import { createMockSupabaseClient, mockNotes } from "./mocks/supabase";
import { createMockAuth, createMockCurrentUser, mockClerkUser } from "./mocks/clerk";

// Mock environment variables
process.env.OPENAI_API_KEY = "test-openai-key";
process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.GITHUB_CLIENT_ID = "test-github-client-id";
process.env.GITHUB_CLIENT_SECRET = "test-github-client-secret";

// Mock OpenAI
vi.mock("openai", () => ({
  default: class MockOpenAI {
    embeddings = {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      }),
    };
  },
}));

// Mock Anthropic
vi.mock("@anthropic-ai/sdk", () => ({
  default: class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(mockIncubatorResponse) }],
      }),
      stream: vi.fn().mockResolvedValue({
        async *[Symbol.asyncIterator]() {
          yield {
            type: "content_block_delta",
            delta: { type: "text_delta", text: JSON.stringify(mockIncubatorResponse) },
          };
        },
      }),
    };
  },
}));

// Mock Clerk
vi.mock("@clerk/nextjs/server", () => ({
  auth: createMockAuth(true),
  currentUser: createMockCurrentUser(true),
  clerkClient: {
    users: {
      getUser: vi.fn().mockResolvedValue(mockClerkUser),
    },
  },
}));

// Mock Supabase
const mockSupabase = createMockSupabaseClient();

vi.mock("@/lib/db", () => ({
  supabaseAdmin: mockSupabase,
  supabase: mockSupabase,
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Web Crypto API for Node.js environment
if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.subtle) {
  // Use Node.js crypto module
  const { webcrypto } = await import("crypto");
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
    writable: true,
  });
}

// Mock TextEncoder/TextDecoder if not available
if (typeof globalThis.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = await import("util");
  Object.defineProperty(globalThis, "TextEncoder", {
    value: TextEncoder,
    writable: true,
  });
  Object.defineProperty(globalThis, "TextDecoder", {
    value: TextDecoder,
    writable: true,
  });
}

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
  get length() {
    return Object.keys(localStorageMock.store).length;
  },
  key: vi.fn((index: number) => Object.keys(localStorageMock.store)[index] || null),
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Setup and teardown
beforeAll(() => {
  // Any global setup
});

afterEach(() => {
  // Reset mocks between tests
  vi.clearAllMocks();
  localStorageMock.clear();
});

afterAll(() => {
  // Cleanup
  vi.restoreAllMocks();
});

// Export mocks for use in tests
export {
  mockSupabase,
  mockNotes,
  mockEmbedding,
  mockIncubatorResponse,
  mockThinkingProfile,
  localStorageMock,
};
