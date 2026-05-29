import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const keyLength = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, keyLength).toString('hex');

  return `${salt}:${hash}`;
}

export function verifyPassword(
  password: string,
  storedPassword: string,
): boolean {
  const [salt, storedHash] = storedPassword.split(':');

  if (!salt || !storedHash) {
    return false;
  }

  const hashBuffer = Buffer.from(storedHash, 'hex');
  const suppliedHashBuffer = scryptSync(password, salt, keyLength);

  return (
    hashBuffer.length === suppliedHashBuffer.length &&
    timingSafeEqual(hashBuffer, suppliedHashBuffer)
  );
}
