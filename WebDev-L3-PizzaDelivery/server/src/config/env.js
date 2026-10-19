import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pizzaverse',
  USE_MEMORY_DB: process.env.USE_MEMORY_DB === 'true',
  JWT_SECRET: process.env.JWT_SECRET || 'pizzaverse_super_secret_jwt_key_2026_dev_mode_change_in_production!',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'pizzaverse_secure_cookie_secret_key_998877',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000',
  // Mail configuration
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'PizzaVerse <noreply@pizzaverse.local>',
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'ethereal', // 'ethereal', 'smtp', or 'console'
  // Razorpay Test-Mode Configuration
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_PVTestKey2026',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'pv_sec_test_SecretKey2026',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'pv_whsec_test_WebhookKey2026',
  // Admin & Inventory Alerts Configuration (Part 4)
  ADMIN_NOTIFICATION_EMAIL: process.env.ADMIN_NOTIFICATION_EMAIL || 'admin.inventory@pizzaverse.local',
  INVENTORY_CHECK_CRON: process.env.INVENTORY_CHECK_CRON || '0 * * * *', // Hourly by default
  ADMIN_DEFAULT_EMAIL: process.env.ADMIN_DEFAULT_EMAIL || 'admin@pizzaverse.local',
  ADMIN_DEFAULT_PASSWORD: process.env.ADMIN_DEFAULT_PASSWORD || 'AdminMasterPass2026!',
};

// Validate critical variables in production
if (env.NODE_ENV === 'production') {
  const missing = [];
  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!process.env.MONGODB_URI) missing.push('MONGODB_URI');
  if (!process.env.CLIENT_URL) missing.push('CLIENT_URL');

  if (missing.length > 0) {
    throw new Error(`[CRITICAL] Missing required production environment variables: ${missing.join(', ')}`);
  }
}
