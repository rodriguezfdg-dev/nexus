import crypto from 'crypto'

/**
 * Generates a cryptographically secure hashed password using Node's native scrypt with a random salt.
 * Output format: `salt:hashedKey`
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derivedKey}`
}

/**
 * Verifies a plain password against the stored password hash.
 * Includes constant-time comparison to prevent timing attacks.
 * Also supports backward compatibility for existing plain passwords in development.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !password) return false

  // If stored in salt:key format
  if (storedHash.includes(':')) {
    const [salt, key] = storedHash.split(':')
    if (!salt || !key) return false

    const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex')
    const keyBuffer = Buffer.from(key, 'hex')
    const derivedBuffer = Buffer.from(derivedKey, 'hex')

    if (keyBuffer.length !== derivedBuffer.length) return false
    return crypto.timingSafeEqual(keyBuffer, derivedBuffer)
  }

  // Backward-compatibility fallback for legacy entries
  return password === storedHash
}
