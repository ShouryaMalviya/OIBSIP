import { User } from '../models/User.js';
import { env } from '../config/env.js';

/**
 * Securely provision or update an administrative account
 * Does not allow public creation; uses environment configuration or CLI arguments
 */
export async function provisionAdminAccount({
  email = env.ADMIN_DEFAULT_EMAIL || 'admin@pizzaverse.local',
  password = env.ADMIN_DEFAULT_PASSWORD || 'AdminMasterPass2026!',
  name = 'Head Pizzaiolo Administrator',
} = {}) {
  const normalizedEmail = email.toLowerCase().trim();

  // Validate password complexity
  if (!password || password.length < 8) {
    throw new Error('Admin password must be at least 8 characters long.');
  }

  const passwordHash = await User.hashPassword(password);

  let existing = await User.findOne({ email: normalizedEmail });

  if (existing) {
    existing.role = 'admin';
    existing.isEmailVerified = true;
    existing.passwordHash = passwordHash;
    existing.name = name;
    await existing.save();
    console.log(`[ADMIN SEED] Existing account "${normalizedEmail}" upgraded/updated with administrator privileges.`);
    return existing;
  }

  const adminUser = new User({
    name,
    email: normalizedEmail,
    passwordHash,
    role: 'admin',
    isEmailVerified: true,
  });

  await adminUser.save();
  console.log(`[ADMIN SEED] Successfully provisioned administrator account: ${normalizedEmail}`);
  return adminUser;
}

// Allow standalone CLI execution: node src/scripts/seed-admin.js
if (process.argv[1]?.includes('seed-admin.js')) {
  provisionAdminAccount()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[ADMIN SEED ERROR]', err);
      process.exit(1);
    });
}

export default provisionAdminAccount;
