import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Recommended IV length for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a consistent 32-byte key from the environment secret or fallback key
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || "gitreadme_devtopia_default_secret_32bytes!!";
  return crypto.scryptSync(secret, "gitreadme_salt", 32);
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: `${ivHex}:${authTagHex}:${ciphertextHex}`
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted payload and verifies its authenticity.
 * Throws if authentication tag does not match (tamper detection).
 */
export function decryptToken(encryptedPayload: string): string {
  if (!encryptedPayload) return "";
  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token payload format.");
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid authentication tag length.");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
