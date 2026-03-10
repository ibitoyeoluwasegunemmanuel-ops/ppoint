import bcrypt from 'bcrypt';
import crypto from 'crypto';

const BCRYPT_ROUNDS = 10;
const isBcryptHash = (value) => typeof value === 'string' && value.startsWith('$2');
const hashPasswordWithScrypt = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const verifyPasswordWithScrypt = (password, storedHash) => {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }

  const [salt, hash] = storedHash.split(':');
  const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
};

export const hashPassword = (password) => {
  return bcrypt.hashSync(String(password), BCRYPT_ROUNDS);
};

export const verifyPassword = (password, storedHash) => {
  if (!storedHash) {
    return false;
  }

  if (isBcryptHash(storedHash)) {
    return bcrypt.compareSync(String(password), storedHash);
  }

  return verifyPasswordWithScrypt(password, storedHash);
};

export const needsPasswordRehash = (storedHash) => !isBcryptHash(storedHash);

export const createResetToken = (prefix = 'rst') => `${prefix}_${crypto.randomBytes(24).toString('hex')}`;

export const createSessionToken = (prefix = 'sess') => `${prefix}_${crypto.randomBytes(24).toString('hex')}`;

export const createApiKey = () => `pk_live_${crypto.randomBytes(12).toString('hex')}`;

export const maskApiKey = (apiKey) => {
  if (!apiKey) {
    return null;
  }

  return `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}`;
};
