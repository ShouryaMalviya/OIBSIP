import { authService } from '../services/auth.service.js';
import { getAuthCookieOptions } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return sendSuccess(
      res,
      201,
      'Registration successful. Please check your email for the verification link.',
      result
    );
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const result = await authService.verifyEmail(req.body);
    return sendSuccess(res, 200, result.message, { user: result.user });
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (req, res, next) => {
  try {
    const result = await authService.resendVerification(req.body);
    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { token, user } = await authService.login(req.body);

    // Set secure HTTP-only cookie
    res.cookie('token', token, getAuthCookieOptions());

    return sendSuccess(res, 200, 'Welcome back to PizzaVerse!', {
      token,
      user,
    });
  } catch (error) {
    // If user is unverified, pass through the custom metadata for the frontend
    if (error.isEmailVerified === false) {
      return res.status(403).json({
        success: false,
        message: error.message,
        isEmailVerified: false,
        email: error.email,
      });
    }
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // Clear the HTTP-only cookie
    res.clearCookie('token', {
      ...getAuthCookieOptions(),
      maxAge: 0,
    });

    return sendSuccess(res, 200, 'Logged out successfully. See you soon!');
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    // req.user was attached by the authenticate middleware
    return sendSuccess(res, 200, 'Current user profile retrieved', {
      user: req.user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);

    // Invalidate any active cookie upon password change
    res.clearCookie('token', {
      ...getAuthCookieOptions(),
      maxAge: 0,
    });

    return sendSuccess(res, 200, result.message);
  } catch (error) {
    next(error);
  }
};
