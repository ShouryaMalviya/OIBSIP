import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { generateRandomToken, hashToken } from '../utils/crypto.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './mail.service.js';

class AuthService {
  /**
   * Register a new customer account
   */
  async register({ name, email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const error = new Error('An account with this email address is already registered.');
      error.statusCode = 409;
      error.isOperational = true;
      throw error;
    }

    // Hash the password with bcrypt (12 rounds)
    const passwordHash = await User.hashPassword(password);

    // Generate cryptographically secure verification token
    const rawVerificationToken = generateRandomToken();
    const emailVerificationTokenHash = hashToken(rawVerificationToken);
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Always enforce role 'user' for public registration (prevent privilege escalation)
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
      isEmailVerified: false,
      emailVerificationTokenHash,
      emailVerificationExpires,
    });

    await user.save();

    // Send verification email via Nodemailer
    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: rawVerificationToken,
      });
    } catch (mailError) {
      console.error('[MAIL ERROR] Failed to send verification email:', mailError.message);
      // We still created the user, they can use "Resend Verification"
    }

    return {
      user: user.toJSON(),
      // In development mode only, provide the token for instant testing convenience
      ...(env.NODE_ENV === 'development' ? { devVerificationToken: rawVerificationToken } : {}),
    };
  }

  /**
   * Verify an account via raw token
   */
  async verifyEmail({ token }) {
    const tokenHash = hashToken(token);

    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      const error = new Error('Verification token is invalid, expired, or has already been used.');
      error.statusCode = 400;
      error.isOperational = true;
      throw error;
    }

    user.isEmailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpires = null;
    await user.save();

    return {
      message: 'Email successfully verified. You can now log in to PizzaVerse.',
      user: user.toJSON(),
    };
  }

  /**
   * Resend verification email for an unverified account
   */
  async resendVerification({ email }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Prevent account enumeration by always returning a generic success message
    if (!user) {
      return {
        message: 'If an unverified account with this email exists, a new verification link has been sent.',
      };
    }

    if (user.isEmailVerified) {
      return {
        message: 'This account email is already verified. You can sign in directly.',
        alreadyVerified: true,
      };
    }

    const rawVerificationToken = generateRandomToken();
    user.emailVerificationTokenHash = hashToken(rawVerificationToken);
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: rawVerificationToken,
      });
    } catch (mailError) {
      console.error('[MAIL ERROR] Failed to resend verification email:', mailError.message);
    }

    return {
      message: 'If an unverified account with this email exists, a new verification link has been sent.',
      ...(env.NODE_ENV === 'development' ? { devVerificationToken: rawVerificationToken } : {}),
    };
  }

  /**
   * Authenticate user with email and password
   */
  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Query user and explicitly select passwordHash
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.isOperational = true;
      throw error;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password.');
      error.statusCode = 401;
      error.isOperational = true;
      throw error;
    }

    // Strict requirement: Reject unverified accounts
    if (!user.isEmailVerified) {
      const error = new Error('Your email address has not been verified yet. Please check your inbox or request a new verification link.');
      error.statusCode = 403;
      error.isOperational = true;
      error.isEmailVerified = false;
      error.email = user.email;
      throw error;
    }

    // Issue signed JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: user.toJSON(),
    };
  }

  /**
   * Request password reset token
   */
  async forgotPassword({ email }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Avoid revealing whether an email address exists
    if (!user) {
      return {
        message: 'If an account with that email address exists, a password reset link has been dispatched.',
      };
    }

    const rawResetToken = generateRandomToken();
    user.passwordResetTokenHash = hashToken(rawResetToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
    await user.save();

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token: rawResetToken,
      });
    } catch (mailError) {
      console.error('[MAIL ERROR] Failed to send password reset email:', mailError.message);
    }

    return {
      message: 'If an account with that email address exists, a password reset link has been dispatched.',
      ...(env.NODE_ENV === 'development' ? { devResetToken: rawResetToken } : {}),
    };
  }

  /**
   * Reset user password using token
   */
  async resetPassword({ token, password }) {
    const tokenHash = hashToken(token);

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      const error = new Error('Password reset token is invalid or has expired.');
      error.statusCode = 400;
      error.isOperational = true;
      throw error;
    }

    // Hash the new password
    user.passwordHash = await User.hashPassword(password);
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    await user.save();

    return {
      message: 'Your password has been successfully reset. You can now log in with your new credentials.',
    };
  }
}

export const authService = new AuthService();
