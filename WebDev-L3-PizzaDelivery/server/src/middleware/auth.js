import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { sendError } from '../utils/response.js';

export const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

/**
 * Middleware to authenticate requests using JWT from HTTP-only cookie or Authorization header
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HTTP-only cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Or fallback to Bearer token in Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 401, 'Authentication required. Please log in.');
    }

    // Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return sendError(res, 401, 'Invalid or expired authentication token.');
    }

    // Lookup user in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return sendError(res, 401, 'User account no longer exists.');
    }

    // Attach fresh user document to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Session expired or invalid. Please sign in again.');
    }
    next(error);
  }
};

/**
 * Middleware to restrict access based on user role (e.g., 'admin')
 * @param  {...string} roles 
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Unauthorized. Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'Forbidden. You do not have permission to perform this action.');
    }

    next();
  };
};
