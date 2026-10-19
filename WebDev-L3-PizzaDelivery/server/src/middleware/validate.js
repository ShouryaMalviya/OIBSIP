import { ZodError } from 'zod';
import { sendError } from '../utils/response.js';

/**
 * Express middleware to validate request body against a Zod schema
 * @param {import('zod').ZodSchema} schema 
 */
export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.') || 'general';
        formattedErrors[path] = err.message;
      });

      return sendError(res, 400, 'Validation failed', formattedErrors);
    }
    next(error);
  }
};
