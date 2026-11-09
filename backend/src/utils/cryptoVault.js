import crypto from 'crypto';

const DEFAULT_VAULT_SECRET =
  process.env.FINANCIAL_VAULT_KEY ||
  process.env.JWT_SECRET ||
  'hirebuddy_financial_aes256_gcm_vault_key_2026';

function getKeyBuffer() {
  return crypto.createHash('sha256').update(String(DEFAULT_VAULT_SECRET)).digest();
}

/**
 * Encrypt sensitive PII/financial data (PAN, Bank Account Number) using AES-256-GCM
 */
export function encryptSensitiveValue(plainText) {
  if (!plainText) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKeyBuffer(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plainText).trim(), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt sensitive PII/financial data encrypted with AES-256-GCM
 */
export function decryptSensitiveValue(cipherPayload) {
  if (!cipherPayload || !String(cipherPayload).includes(':')) return null;
  try {
    const [ivHex, authTagHex, encryptedHex] = String(cipherPayload).split(':');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getKeyBuffer(),
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    return null;
  }
}

/**
 * Deterministic SHA-256 hash for indexed lookup without storing plaintext PAN
 */
export function hashIdentifier(value) {
  if (!value) return null;
  return crypto
    .createHmac('sha256', getKeyBuffer())
    .update(String(value).trim().toUpperCase())
    .digest('hex');
}

/**
 * Mask Indian PAN (e.g., ABCDE1234F -> XXXXX1234F)
 */
export function maskPan(pan) {
  if (!pan) return null;
  const clean = String(pan).trim().toUpperCase();
  if (clean.length < 6) return 'XXXXXXXXXX';
  return `${'X'.repeat(Math.max(0, clean.length - 5))}${clean.slice(-5)}`;
}

/**
 * Validate standard 10-character Indian PAN format: 5 letters, 4 digits, 1 letter
 */
export function isValidIndianPan(pan) {
  if (!pan) return false;
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(pan).trim().toUpperCase());
}

/**
 * Validate standard 15-character Indian GSTIN format
 */
export function isValidIndianGstin(gstin) {
  if (!gstin) return false;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
    String(gstin).trim().toUpperCase()
  );
}

/**
 * Mask Bank Account Number (e.g., 123456789012 -> XXXXXXXX9012)
 */
export function maskBankAccount(accountNumber) {
  if (!accountNumber) return null;
  const clean = String(accountNumber).replace(/\s+/g, '');
  if (clean.length <= 4) return clean;
  return `${'X'.repeat(clean.length - 4)}${clean.slice(-4)}`;
}

/**
 * Assert and normalize integer paise. Rejects negative or non-finite values.
 */
export function assertIntegerPaise(value, fieldName = 'amountPaise') {
  const num = Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num < 0) {
    throw new Error(`Invalid integer paise for ${fieldName}: ${value}`);
  }
  return num;
}

/**
 * Integer basis-points multiplication: Math.round((amountPaise * rateBps) / 10000)
 * 100 bps = 1.00%, 1800 bps = 18.00%, 10000 bps = 100.00%
 */
export function multiplyBpsRound(amountPaise, rateBps) {
  const paise = assertIntegerPaise(amountPaise, 'amountPaise');
  const bps = assertIntegerPaise(rateBps, 'rateBps');
  if (paise === 0 || bps === 0) return 0;
  return Math.round((paise * bps) / 10000);
}

/**
 * Convert Rupees (number or string) to exact integer Paise without floating-point drift
 */
export function rupeesToPaise(rupees) {
  const str = String(rupees).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(str)) {
    return assertIntegerPaise(Math.round(Number(rupees) * 100), 'rupeesToPaise');
  }
  const [whole, frac = ''] = str.split('.');
  const paddedFrac = (frac + '00').slice(0, 2);
  return Number(whole) * 100 + Number(paddedFrac);
}

/**
 * Format integer Paise as a 2-decimal Rupee string (e.g., 100050 -> "1000.50")
 */
export function paiseToRupees(paise) {
  const valid = assertIntegerPaise(paise, 'paise');
  const whole = Math.floor(valid / 100);
  const rem = String(valid % 100).padStart(2, '0');
  return `${whole}.${rem}`;
}

