import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token (64 hex characters)
 */
export const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a token using SHA-256 for secure database storage and comparison
 * @param {string} token 
 * @returns {string} 64 character hex hash
 */
export const hashToken = (token) => {
  if (!token) return '';
  return crypto.createHash('sha256').update(token).digest('hex');
};
