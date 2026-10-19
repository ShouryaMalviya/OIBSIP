import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Strict CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman in dev)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        env.CLIENT_URL,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked request from origin: ${origin}`));
    },
    credentials: true, // Allow cookies to be sent across origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Cart-Token', 'X-Razorpay-Signature'],
  })
);

// Body parsing with safe size limits and rawBody retention for webhook signature verification
app.use(
  express.json({
    limit: '50kb',
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Cookie parser for secure HTTP-only auth cookies
app.use(cookieParser(env.COOKIE_SECRET));

// Root welcome probe
app.get('/', (req, res) => {
  res.json({
    message: '🍕 Welcome to PizzaVerse API Server',
    documentation: '/api/health',
    version: '1.0.0 (Part 1 Architecture)',
  });
});

// Mount master API routes
app.use('/api', apiRoutes);

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

export default app;
