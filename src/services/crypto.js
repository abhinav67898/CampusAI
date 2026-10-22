import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

function key() {
  const value = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY || '', 'base64');
  if (value.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must be base64 encoding of exactly 32 bytes.');
  return value;
}

export function encryptSecret(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map(part => part.toString('base64url')).join('.');
}

export function decryptSecret(value) {
  const [ivText, tagText, encryptedText] = value.split('.');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivText, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedText, 'base64url')), decipher.final()]).toString('utf8');
}
