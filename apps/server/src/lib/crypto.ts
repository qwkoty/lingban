import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function deriveKey(secret: string, salt: Buffer): Buffer {
  return crypto.scryptSync(secret, salt, KEY_LENGTH);
}

export function encryptApiKey(plainText: string, secret: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(secret, salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, authTag, encrypted]).toString('base64');
}

export function decryptApiKey(cipherText: string, secret: string): string {
  const data = Buffer.from(cipherText, 'base64');
  const salt = data.subarray(0, SALT_LENGTH);
  const iv = data.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = data.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const encrypted = data.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const key = deriveKey(secret, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function getEncryptionSecret(): string {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('API_KEY_ENCRYPTION_SECRET is not configured');
  }
  return secret;
}
