# 🍕 PizzaVerse — Premium Artisanal Pizza Platform

> **Part 1 of 5: Enterprise Monorepo Architecture, Six-Colour Design System, and Cryptographic Authentication Engine**

---

## 📖 Executive Summary

**PizzaVerse** is an enterprise-grade full-stack pizza ordering, customization, payment, order tracking, and inventory management platform. 

This repository houses **Part 1 of a 5-part implementation**. It establishes a rock-solid, production-ready architectural foundation featuring:
- A responsive React + Vite client styled with a bespoke 6-colour contemporary pizzeria design system.
- An Express.js backend protected by Helmet, rate limiting, and Zod input validation.
- Cryptographically secure authentication: bcryptjs hashing, SHA-256 tokenized email verification, and HTTP-only JWT sessions.
- Dual-mode database persistence supporting both live MongoDB (local or Atlas) and an instantaneous zero-config in-memory fallback for immediate evaluation.
- HTML email templates with Nodemailer and automatic Ethereal test account previews.

---

## 🎨 2. Design System & Brand Identity

The application strictly implements the curated six-colour palette across all UI components and email templates:

| Token Name | Hex Code | Semantic Role | Reusable CSS Variable |
| :--- | :--- | :--- | :--- |
| **Praxeti White** | `#F6F7ED` | Main application background, warm editorial canvas | `--color-praxeti-white: #F6F7ED;` |
| **Spring** | `#DBE64C` | Brand accent, badges, ratings, highlights | `--color-spring: #DBE64C;` |
| **Midnight Mirage**| `#001F3F` | Deep header, typography, primary surfaces | `--color-midnight-mirage: #001F3F;` |
| **Mantis** | `#74C365` | Secondary accent, status badges, herb tones | `--color-mantis: #74C365;` |
| **Book Green** | `#00804C` | Primary CTA buttons, success indicators | `--color-book-green: #00804C;` |
| **Nuit Blanche** | `#1E488F` | Active states, hover transitions, borders | `--color-nuit-blanche: #1E488F;` |

### Typography
- **Headings & Display**: `Outfit`, Google Fonts (`font-display`)
- **Body & Forms**: `Plus Jakarta Sans`, Google Fonts (`font-sans`)
- **Editorial Accents**: `Playfair Display`, Google Fonts (`font-serif-brand`)

---

## 📂 3. Monorepo Architecture

```text
pizzaverse/
├── package.json               # Monorepo orchestrator (concurrently)
├── README.md                  # Comprehensive technical documentation
├── .gitignore                 # Root gitignore
├── test-auth.js               # End-to-end automated auth test suite
│
├── client/                    # Frontend (React 19, Vite, Tailwind CSS v4)
│   ├── public/                # Static public assets
│   ├── src/
│   │   ├── assets/            # Static imagery and logos
│   │   ├── components/        # Reusable component library
│   │   │   ├── common/        # Button, Input, Badge, SkeletonLoader, Navbar, Footer
│   │   │   └── pizza/         # PizzaCard, PizzaDetailModal
│   │   ├── context/           # AuthContext (React Context API)
│   │   ├── data/              # High-resolution artisanal pizza catalog
│   │   ├── layouts/           # MainLayout (Sticky header, content, footer, toasts)
│   │   ├── pages/             # 8 Core Public Pages + Profile + Builder Teaser
│   │   │   ├── Home.jsx       # Hero, featured pizzas, how-it-works, benefits, CTAs
│   │   │   ├── Menu.jsx       # Catalog with category filters, search, dietary toggles
│   │   │   ├── Login.jsx      # Form with unverified account banner & resend flow
│   │   │   ├── Register.jsx   # Form with live password strength meter
│   │   │   ├── VerifyEmail.jsx# Auto/manual token verification & resend handler
│   │   │   ├── ForgotPassword.jsx # Secure non-enumerating recovery request
│   │   │   ├── ResetPassword.jsx  # New password submission
│   │   │   ├── Profile.jsx    # User security overview & loyalty badge
│   │   │   ├── BuilderPreview.jsx # Part 2 custom builder roadmap preview
│   │   │   └── NotFound.jsx   # Branded 404 ("Slice Not Found")
│   │   ├── routes/            # AppRoutes (React Router DOM)
│   │   ├── services/          # Centralized Axios client (api.js, auth.service.js)
│   │   └── styles/            # index.css (CSS variables & Tailwind tokens)
│   ├── index.html             # HTML shell with Google Fonts & SEO tags
│   ├── vite.config.js         # Vite configuration with React & Tailwind plugins
│   ├── package.json           # Client dependencies
│   ├── .env.example           # Client environment template
│   └── .env                   # Active client environment
│
└── server/                    # Backend (Node.js, Express.js, Mongoose, JWT)
    ├── src/
    │   ├── config/            # db.js (Dual Mongoose/Memory), env.js, mail.js
    │   ├── controllers/       # auth.controller.js
    │   ├── middleware/        # auth.js (JWT/Cookie), validate.js (Zod), rateLimiter.js, errorHandler.js
    │   ├── models/            # User.js (Dual Mongoose Schema & In-Memory fallback)
    │   ├── routes/            # auth.routes.js, index.js (Extensible master router)
    │   ├── services/          # auth.service.js, mail.service.js (HTML email templates)
    │   ├── utils/             # crypto.js (Tokens & SHA-256), response.js (Standard JSON)
    │   ├── validators/        # auth.validator.js (Zod schemas)
    │   ├── app.js             # Express application assembly (Helmet, CORS, cookies)
    │   └── server.js          # Server bootstrap, DB initialization, graceful shutdown
    ├── package.json           # Server dependencies
    ├── .env.example           # Server environment template
    └── .env                   # Active server environment
```

---

## 🛠️ 4. Technology Stack

### Frontend
- **Framework**: React 19 with Vite 8
- **Language**: JavaScript (ES Modules & JSX)
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS v4 + Custom CSS Architecture with Six-Color Tokens
- **Icons**: Lucide React
- **HTTP Client**: Axios with centralized interceptors & `withCredentials: true`
- **Form Handling**: React Hook Form
- **Notifications**: React Hot Toast with brand styling

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM (Plus Instant Dev In-Memory Fallback)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) + HTTP-only Cookie Strategy
- **Password Security**: `bcryptjs` (12 salt rounds)
- **Email Delivery**: `nodemailer` with rich responsive HTML templates and Ethereal preview URLs
- **Validation**: `zod` schema validation on all inputs
- **Security**: `helmet`, `cors`, `express-rate-limit`, `cookie-parser`

---

## ⚙️ 5. Setup & Installation Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher (`node -v`)
- **NPM**: v9.0.0 or higher (`npm -v`)
- **MongoDB** *(Optional)*: A local MongoDB instance or MongoDB Atlas cluster. (If no MongoDB is active, the application automatically launches in Zero-Config In-Memory mode without any configuration needed!).

### Step 1: Clone and Install Dependencies

To install all dependencies across the monorepo, run:
```bash
# From workspace root
npm install
npm install --prefix server
npm install --prefix client
```
*(Or simply run `npm run install:all`)*

---

### Step 2: Environment Configuration

Both `client` and `server` contain `.env.example` templates and pre-configured `.env` files.

#### Server Environment (`server/.env`):
```ini
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
API_BASE_URL=http://localhost:5000

# Database Configuration
# Live local instance: mongodb://127.0.0.1:27017/pizzaverse
# Live Atlas instance: mongodb+srv://<user>:<pass>@cluster.mongodb.net/pizzaverse
# If the daemon is unreachable, it automatically uses the in-memory store in dev mode.
MONGODB_URI=mongodb://127.0.0.1:27017/pizzaverse
USE_MEMORY_DB=false

# Secrets (Minimum 32 characters in production)
JWT_SECRET=pizzaverse_dev_secret_key_8492039482039482039482390482093842
JWT_EXPIRES_IN=7d
COOKIE_SECRET=pizzaverse_dev_cookie_secret_99887766554433221100

# Email Delivery (Leave empty to use ephemeral Ethereal test accounts with browser preview links)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="PizzaVerse Artisanal" <noreply@pizzaverse.local>
EMAIL_SERVICE=ethereal
```

#### Client Environment (`client/.env`):
```ini
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🚀 6. Running the Application

### Option A: Run Both Simultaneously (Recommended)
From the root directory:
```bash
npm run dev
```
This boots up:
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`

### Option B: Run Individually in Separate Terminals

**Terminal 1 (Backend Server):**
```bash
npm run dev:server
# or
cd server && npm run dev
```

**Terminal 2 (Frontend Client):**
```bash
npm run dev:client
# or
cd client && npm run dev
```

---

## 📡 7. API Specification Reference

All endpoints return standardized JSON structures:
- **Success**: `{ success: true, message: string, data?: any }`
- **Error**: `{ success: false, message: string, errors?: object }`

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Service health & version heartbeat |
| `POST` | `/api/auth/register` | Public | Register new user, hash password, send verification email |
| `POST` | `/api/auth/verify-email` | Public | Verify account using cryptographic token |
| `POST` | `/api/auth/resend-verification` | Public (Rate Limited) | Request fresh email verification token |
| `POST` | `/api/auth/login` | Public (Rate Limited) | Authenticate user, reject unverified, issue JWT & cookie |
| `POST` | `/api/auth/logout` | Public | Invalidate HTTP-only session cookie |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `POST` | `/api/auth/forgot-password`| Public (Rate Limited) | Request password reset token via email |
| `POST` | `/api/auth/reset-password` | Public (Rate Limited) | Set new password via cryptographic token |

---

## 🧪 8. Automated & Manual Verification Walkthrough

### Automated Verification
An automated test script is provided in the repository root that executes all authentication and security flows against the live server:
```bash
node test-auth.js
```
Expected output:
```text
--- STARTING BACKEND AUTH ENDPOINT VERIFICATION ---
[1] Testing Health Check... -> 200 OK
[2] Testing Registration... -> 201 Created (Token Generated)
[3] Testing Duplicate Registration Rejection... -> 409 Conflict
[4] Testing Login with Unverified Account... -> 403 Forbidden
[5] Testing Email Verification... -> 200 OK
[6] Testing Login Post-Verification... -> 200 OK (JWT Issued)
[7] Testing GET /api/auth/me... -> 200 OK (Profile Returned)
[8] Testing Forgot Password... -> 200 OK (Reset Token Generated)
[9] Testing Reset Password... -> 200 OK (Password Updated)
[10] Testing Login with New Password... -> 200 OK
[11] Testing Logout... -> 200 OK
--- ALL BACKEND AUTH ENDPOINTS PASSED WITH FLYING COLORS! ---
```

---

### Manual Verification Steps (Frontend UI)

1. **Explore the Landing Page**:
   - Open `http://localhost:5173/`.
   - Inspect the hero headline, editorial design, and food photography.
   - Click "View Details" on any pizza card to view ingredients and price in the modal.
   - Click "Explore Menu" in the hero or top navigation.

2. **Test Menu Filtering**:
   - On `http://localhost:5173/menu`, click category tabs ("Classic", "Artisanal", "Signature").
   - Click the "Vegetarian" or "Spicy" dietary toggle to watch the grid filter in real time.
   - Type an ingredient (e.g., "Truffle") into the search bar.

3. **User Registration & Password Strength**:
   - Navigate to `http://localhost:5173/register`.
   - Type a password and watch the dynamic 5-level strength meter update in real time.
   - Fill in:
     - Name: `Gourmet Foodie`
     - Email: `foodie@pizzaverse.local`
     - Password: `Password123!`
     - Confirm Password: `Password123!`
   - Click "Create Account".
   - Observe the confirmation screen indicating the verification email has been dispatched.

4. **Verify Email Address**:
   - Click the development fast-track link on the screen, or navigate to `/verify-email?token=<token>`.
   - Observe the success confirmation state: "Account Verified! You now have full access to PizzaVerse menu and ordering privileges."

5. **Sign In & Session Inspection**:
   - Click "Sign In to Your Account" (or visit `/login`).
   - Sign in with `foodie@pizzaverse.local` and `Password123!`.
   - You will be redirected to `/profile`.
   - Confirm your name, email, the "Artisanal Connoisseur" badge, and "Email Verified" status are displayed.

6. **Password Recovery Flow**:
   - Click "Sign Out".
   - Navigate to `/forgot-password`, enter `foodie@pizzaverse.local`, and click "Send Password Reset Link".
   - In development, the reset link is logged in the backend terminal. Navigate to `/reset-password?token=<token>`.
   - Enter a new password: `NewPassword456$`.
   - Sign in with your new credentials.

---

## 🛡️ 9. Security Implementations

- **Zero Plaintext Sensitive Data**: Passwords are hashed with `bcryptjs` (salt rounds 12). Email verification and password reset tokens are hashed with SHA-256 before database storage.
- **Role Escalation Protection**: The registration Zod schema strictly strips unauthorized fields like `role` or `isAdmin`. Only `user` is ever assigned on public registration.
- **Account Enumeration Defense**: `forgot-password` and `resend-verification` return identical success responses regardless of whether the email exists.
- **Brute Force & Abuse Protection**: Stricter rate limiting (`sensitiveActionLimiter`) on recovery endpoints (max 5 requests per 15 min), and standard limiting on login/register (max 30 requests per 15 min).
- **HTTP-Only Cookies**: Protected authentication cookies with `httpOnly: true`, `sameSite: 'lax'`, and `secure: true` in production.
- **Helmet Security Headers**: Standard HTTP security headers enabled.
- **Centralized Error Handler**: Internal database error details and stack traces are suppressed in production mode.

---

## ❓ 10. Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Port 5000 Already In Use** | Another server or process is occupying port 5000 | Set `PORT=5001` in `server/.env` and update `VITE_API_BASE_URL=http://localhost:5001/api` in `client/.env`. |
| **Port 5173 Already In Use** | Another Vite dev server is running | Vite will automatically use port 5174. Update `CLIENT_URL=http://localhost:5174` in `server/.env`. |
| **MongoDB Connection Notice** | Local `mongod` daemon is not started | The application automatically uses the instant in-memory storage engine. You can continue testing immediately. To use a live MongoDB, start your local service or set a MongoDB Atlas URI in `server/.env`. |
| **Email Not Arriving** | No external SMTP configured | In development, emails use Ethereal. Look in the backend terminal logs for the clickable preview URL (`https://ethereal.email/message/...`) or dev tokens. |

---

## 📋 11. Continuation Contract for Parts 2–5

This completes **Part 1 of 5**. The entire codebase is organized to be cleanly extended without rewriting existing authentication, routing, or database models:

- **Part 2**: Pizza Catalog & Interactive Custom Pizza Builder (crust options, sauce canvas, cheeses, artisanal toppings, dynamic price calculator).
- **Part 3**: Cart Management, Pricing Engine, Order Creation, and Razorpay test-mode payment gateway integration.
- **Part 4**: Admin Dashboard, Live Kitchen Inventory Management, and Stock Shortage Notifications.
- **Part 5**: Real-Time Order Tracking Pipeline (Placed &rarr; Fermenting/Prepped &rarr; Wood-Fired Bake &rarr; Out for Flash Delivery), End-to-End Polish, and Deployment Readiness.
