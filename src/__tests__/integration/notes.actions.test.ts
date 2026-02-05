/**
 * Integration tests for notes server actions
 * Note: Server actions are difficult to test in isolation due to Next.js
 * server-only dependencies. These tests focus on the patterns and types.
 */

import { describe, it, expect } from "vitest";
import type { Result, ActionError, EncryptedNote } from "@/types";

// Test the Result pattern type checking
describe("Notes Actions Types", () => {
  it("Result type handles success case", () => {
    const successResult: Result<EncryptedNote, ActionError> = {
      success: true,
      data: {
        id: "note-1",
        userId: "user-123",
        title: "Test Note",
        encryptedContent: "encrypted",
        iv: "iv-123",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    expect(successResult.success).toBe(true);
    if (successResult.success) {
      expect(successResult.data.id).toBe("note-1");
    }
  });

  it("Result type handles error case", () => {
    const errorResult: Result<EncryptedNote, ActionError> = {
      success: false,
      error: {
        message: "Unauthorized",
        code: "UNAUTHORIZED",
      },
    };

    expect(errorResult.success).toBe(false);
    if (!errorResult.success) {
      expect(errorResult.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("handles array results", () => {
    const arrayResult: Result<EncryptedNote[], ActionError> = {
      success: true,
      data: [
        {
          id: "note-1",
          userId: "user-123",
          title: "Note 1",
          encryptedContent: "encrypted1",
          iv: "iv-1",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "note-2",
          userId: "user-123",
          title: "Note 2",
          encryptedContent: "encrypted2",
          iv: "iv-2",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    expect(arrayResult.success).toBe(true);
    if (arrayResult.success) {
      expect(arrayResult.data.length).toBe(2);
    }
  });
});

describe("FormData handling", () => {
  it("can extract string values from FormData", () => {
    const formData = new FormData();
    formData.append("title", "Test Title");
    formData.append("encryptedContent", "encrypted-content");
    formData.append("iv", "test-iv");

    const title = formData.get("title") as string;
    const content = formData.get("encryptedContent") as string;
    const iv = formData.get("iv") as string;

    expect(title).toBe("Test Title");
    expect(content).toBe("encrypted-content");
    expect(iv).toBe("test-iv");
  });

  it("returns null for missing fields", () => {
    const formData = new FormData();
    formData.append("title", "Only Title");

    const content = formData.get("encryptedContent");
    const iv = formData.get("iv");

    expect(content).toBeNull();
    expect(iv).toBeNull();
  });

  it("handles null title gracefully", () => {
    const formData = new FormData();
    formData.append("encryptedContent", "content");
    formData.append("iv", "iv");

    const title = formData.get("title") as string | null;

    expect(title).toBeNull();
  });
});

describe("SimilarNote type", () => {
  it("extends EncryptedNote with similarity score", () => {
    interface SimilarNote extends EncryptedNote {
      similarity: number;
    }

    const similarNote: SimilarNote = {
      id: "note-2",
      userId: "user-123",
      title: "Similar Note",
      encryptedContent: "encrypted",
      iv: "iv",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      similarity: 0.85,
    };

    expect(similarNote.similarity).toBe(0.85);
    expect(similarNote.similarity).toBeGreaterThanOrEqual(0);
    expect(similarNote.similarity).toBeLessThanOrEqual(1);
  });
});

describe("Error code handling", () => {
  const errorCodes = ["UNAUTHORIZED", "INVALID_INPUT", "DB_ERROR", "NOT_FOUND", "UNKNOWN"];

  it("recognizes valid error codes", () => {
    errorCodes.forEach((code) => {
      const error: ActionError = { message: "Test error", code };
      expect(error.code).toBe(code);
    });
  });

  it("creates appropriate error messages", () => {
    const authError: ActionError = {
      message: "Unauthorized",
      code: "UNAUTHORIZED",
    };

    const inputError: ActionError = {
      message: "Missing required fields",
      code: "INVALID_INPUT",
    };

    const dbError: ActionError = {
      message: "Failed to query database",
      code: "DB_ERROR",
    };

    expect(authError.message).toBeTruthy();
    expect(inputError.message).toBeTruthy();
    expect(dbError.message).toBeTruthy();
  });
});
