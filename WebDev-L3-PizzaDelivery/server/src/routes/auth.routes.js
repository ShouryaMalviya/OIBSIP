import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter, sensitiveActionLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Public registration & verification
router.post('/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/verify-email', validateBody(verifyEmailSchema), authController.verifyEmail);
router.post('/resend-verification', sensitiveActionLimiter, validateBody(resendVerificationSchema), authController.resendVerification);

// Authentication sessions
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/logout', authController.logout);

// Protected user profile
router.get('/me', authenticate, authController.getMe);

// Password recovery
router.post('/forgot-password', sensitiveActionLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', sensitiveActionLimiter, validateBody(resetPasswordSchema), authController.resetPassword);

export default router;
