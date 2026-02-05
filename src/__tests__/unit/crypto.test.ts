/**
 * Unit tests for encryption/decryption utilities
 * These are REAL tests - no mocking, security critical
 */

import { describe, it, expect, beforeAll } from "vitest";
import { encryptContent, type EncryptedData } from "@/lib/crypto/encrypt";
import { decryptContent } from "@/lib/crypto/decrypt";
import { deriveKey, generateSalt } from "@/lib/crypto/keys";

describe("Crypto - Key Derivation", () => {
  it("generates a salt of correct length (16 bytes)", () => {
    const salt = generateSalt();
    expect(salt).toBeInstanceOf(Uint8Array);
    expect(salt.length).toBe(16);
  });

  it("generates unique salts each time", () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    expect(salt1).not.toEqual(salt2);
  });

  it("derives a CryptoKey from password and salt", async () => {
    const password = "test-password-123";
    const salt = generateSalt();

    const key = await deriveKey(password, salt);

    expect(key).toBeDefined();
    expect(key.type).toBe("secret");
    expect(key.algorithm.name).toBe("AES-GCM");
    expect(key.usages).toContain("encrypt");
    expect(key.usages).toContain("decrypt");
  });

  it("derives the same key from same password and salt", async () => {
    const password = "consistent-password";
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

    const key1 = await deriveKey(password, salt);
    const key2 = await deriveKey(password, salt);

    // Encrypt the same data with both keys and compare
    const testData = "test data";
    const iv = new Uint8Array(12).fill(0);

    const encrypted1 = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key1,
      new TextEncoder().encode(testData)
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key2,
      encrypted1
    );

    expect(new TextDecoder().decode(decrypted)).toBe(testData);
  });

  it("derives different keys from different passwords", async () => {
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

    const key1 = await deriveKey("password1", salt);
    const key2 = await deriveKey("password2", salt);

    // Try to decrypt data encrypted with key1 using key2 - should fail
    const testData = "test data";
    const iv = new Uint8Array(12).fill(0);

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key1,
      new TextEncoder().encode(testData)
    );

    await expect(
      crypto.subtle.decrypt({ name: "AES-GCM", iv }, key2, encrypted)
    ).rejects.toThrow();
  });

  it("derives different keys from different salts", async () => {
    const password = "same-password";
    const salt1 = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const salt2 = new Uint8Array([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);

    const key1 = await deriveKey(password, salt1);
    const key2 = await deriveKey(password, salt2);

    const testData = "test data";
    const iv = new Uint8Array(12).fill(0);

    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key1,
      new TextEncoder().encode(testData)
    );

    await expect(
      crypto.subtle.decrypt({ name: "AES-GCM", iv }, key2, encrypted)
    ).rejects.toThrow();
  });
});

describe("Crypto - Encryption", () => {
  let key: CryptoKey;

  beforeAll(async () => {
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    key = await deriveKey("test-encryption-key", salt);
  });

  it("encrypts plaintext and returns ciphertext with IV", async () => {
    const plaintext = "Hello, World!";

    const encrypted = await encryptContent(plaintext, key);

    expect(encrypted).toHaveProperty("ciphertext");
    expect(encrypted).toHaveProperty("iv");
    expect(typeof encrypted.ciphertext).toBe("string");
    expect(typeof encrypted.iv).toBe("string");
    expect(encrypted.ciphertext.length).toBeGreaterThan(0);
    expect(encrypted.iv.length).toBeGreaterThan(0);
  });

  it("produces different ciphertext for same plaintext (due to random IV)", async () => {
    const plaintext = "Same text, different encryptions";

    const encrypted1 = await encryptContent(plaintext, key);
    const encrypted2 = await encryptContent(plaintext, key);

    // Ciphertexts should differ due to different IVs
    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext);
    expect(encrypted1.iv).not.toBe(encrypted2.iv);
  });

  it("encrypts empty string", async () => {
    const plaintext = "";

    const encrypted = await encryptContent(plaintext, key);

    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toBeDefined();
  });

  it("encrypts unicode characters correctly", async () => {
    const plaintext = "Hello 世界 🌍 مرحبا";

    const encrypted = await encryptContent(plaintext, key);

    expect(encrypted.ciphertext).toBeDefined();
    // Verify by decrypting
    const decrypted = await decryptContent(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });

  it("encrypts long text", async () => {
    const plaintext = "A".repeat(10000);

    const encrypted = await encryptContent(plaintext, key);

    expect(encrypted.ciphertext).toBeDefined();
    // Verify by decrypting
    const decrypted = await decryptContent(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });
});

describe("Crypto - Decryption", () => {
  let key: CryptoKey;

  beforeAll(async () => {
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    key = await deriveKey("test-decryption-key", salt);
  });

  it("decrypts ciphertext back to original plaintext", async () => {
    const plaintext = "Secret message to encrypt and decrypt";

    const encrypted = await encryptContent(plaintext, key);
    const decrypted = await decryptContent(encrypted, key);

    expect(decrypted).toBe(plaintext);
  });

  it("fails to decrypt with wrong key", async () => {
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const wrongKey = await deriveKey("wrong-password", salt);

    const plaintext = "This should not decrypt with wrong key";
    const encrypted = await encryptContent(plaintext, key);

    await expect(decryptContent(encrypted, wrongKey)).rejects.toThrow();
  });

  it("fails to decrypt with tampered ciphertext", async () => {
    const plaintext = "This data will be tampered";
    const encrypted = await encryptContent(plaintext, key);

    // Tamper with the ciphertext
    const tamperedCiphertext = encrypted.ciphertext.slice(0, -4) + "XXXX";
    const tamperedData: EncryptedData = {
      ciphertext: tamperedCiphertext,
      iv: encrypted.iv,
    };

    await expect(decryptContent(tamperedData, key)).rejects.toThrow();
  });

  it("fails to decrypt with tampered IV", async () => {
    const plaintext = "This data will have tampered IV";
    const encrypted = await encryptContent(plaintext, key);

    // Tamper with the IV
    const tamperedIv = encrypted.iv.slice(0, -4) + "XXXX";
    const tamperedData: EncryptedData = {
      ciphertext: encrypted.ciphertext,
      iv: tamperedIv,
    };

    await expect(decryptContent(tamperedData, key)).rejects.toThrow();
  });
});

describe("Crypto - Round Trip", () => {
  it("encrypts and decrypts correctly for various inputs", async () => {
    const salt = generateSalt();
    const key = await deriveKey("round-trip-test", salt);

    const testCases = [
      "Simple text",
      "",
      "a",
      "Unicode: 日本語 العربية 🎉",
      "Special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?",
      "Newlines:\nLine 2\nLine 3",
      "Tabs:\tTabbed\tContent",
      JSON.stringify({ foo: "bar", nested: { value: 123 } }),
      "Very long text: " + "x".repeat(50000),
    ];

    for (const original of testCases) {
      const encrypted = await encryptContent(original, key);
      const decrypted = await decryptContent(encrypted, key);
      expect(decrypted).toBe(original);
    }
  });

  it("maintains data integrity across multiple encrypt/decrypt cycles", async () => {
    const salt = generateSalt();
    const key = await deriveKey("multi-cycle-test", salt);
    let text = "Original text";

    // Encrypt and decrypt 5 times
    for (let i = 0; i < 5; i++) {
      const encrypted = await encryptContent(text, key);
      text = await decryptContent(encrypted, key);
    }

    expect(text).toBe("Original text");
  });
});
