import type { EncryptedData } from "./encrypt";

export async function decryptContent(
  encrypted: EncryptedData,
  key: CryptoKey
): Promise<string> {
  const ciphertext = Buffer.from(encrypted.ciphertext, "base64");
  const iv = Buffer.from(encrypted.iv, "base64");

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
