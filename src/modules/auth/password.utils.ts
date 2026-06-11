import * as bcrypt from 'bcrypt';
import { scryptSync, timingSafeEqual } from 'crypto';

const bcryptSaltRounds = 12;
const legacyScryptKeyLength = 64;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, bcryptSaltRounds);
}

export function verifyPassword(
  password: string,
  storedPassword: string,
): boolean {
  if (storedPassword.startsWith('$2')) {
    try {
      return bcrypt.compareSync(password, storedPassword);
    } catch {
      return false;
    }
  }

  return verifyLegacyScryptPassword(password, storedPassword);
}

function verifyLegacyScryptPassword(
  password: string,
  storedPassword: string,
): boolean {
  const [salt, storedHash] = storedPassword.split(':');

  if (!salt || !storedHash) {
    return false;
  }

  const hashBuffer = Buffer.from(storedHash, 'hex');
  const suppliedHashBuffer = scryptSync(password, salt, legacyScryptKeyLength);

  return (
    hashBuffer.length === suppliedHashBuffer.length &&
    timingSafeEqual(hashBuffer, suppliedHashBuffer)
  );
}
