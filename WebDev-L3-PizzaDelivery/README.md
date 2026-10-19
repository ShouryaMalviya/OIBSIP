# 🍕 PizzaVerse — Premium Full-Stack Artisanal Pizza Platform

> **Complete Full-Stack Application: Parts 1–5 Integration**
> Enterprise Monorepo • Curated Six-Colour Design System • Cryptographic Authentication • Artisanal Pizza Catalog • 4-Step Interactive Custom Builder • Authoritative Integer-Paise Pricing Engine • Persistent Shopping Cart • Razorpay Test-Mode Gateway with HMAC-SHA256 Signatures • Role-Protected Admin Command Center • Automated node-cron Low-Stock Watcher with Deduplication • Real-Time Socket.IO Order Tracking & Room Authorization • Customer Live Dashboard with Progress Timeline & Polling Fallback

---

## 📖 1. Executive Summary

**PizzaVerse** is an enterprise-grade full-stack pizza ordering, customization, payment, order tracking, and inventory management platform built from scratch.

This repository represents the completed full-stack integration across all 5 stages:
1. **Part 1 — Foundations & Cryptographic Authentication**: Dual-mode persistence (MongoDB + zero-config memory Map engine), bcrypt password hashing (12 rounds), SHA-256 tokenized email verification via Nodemailer, secure HTTP-only cookie JWT sessions, rate limiting, and defensive Helmet security headers.
2. **Part 2 — Pizza Catalog, Custom Builder & Cart**: Database-backed pizza catalog, 4-step interactive pizza builder (crust, sauce, cheese, multiple vegetables) with visual canvas, and an authoritative pricing engine strictly calculating in integer paise (1 INR = 100 paise) to eliminate floating-point currency drift.
3. **Part 3 — Razorpay Payment & Order Management**: Razorpay test-mode checkout flow, HMAC-SHA256 constant-time signature verification, idempotency guards preventing duplicate charges, and order state transition management.
4. **Part 4 — Role-Protected Admin Dashboard & Inventory**: Separate administrative authentication, live operational metrics, inventory ledger across all 4 recipe categories, manual stock adjustments with mandatory audit reasons, automatic recipe stock deduction on order payment, stock restoration on order cancellation, and node-cron automated low-stock email alerts with deduplication.
5. **Part 5 — Real-Time Order Tracking & Final Integration**: Authenticated Socket.IO architecture, server-side room authorization (customers can only subscribe to their own orders; admins subscribe to `admin:orders` and `admin:inventory`), controlled polling fallback (5s interval with tab-visibility awareness), live progress timeline in Customer Dashboard (Book Green, Mantis, and Spring palette), live admin dispatch queues, and end-to-end automated test suites.

---

## 🎨 2. Design System & Palette

The platform strictly implements a bespoke, contemporary six-colour pizzeria palette without deviations:

| Token Name | Hex Code | Semantic Role | Tailwind / CSS Variable |
| :--- | :--- | :--- | :--- |
| **Praxeti White** | `#F6F7ED` | Main workspace background, editorial warm canvas | `--color-praxeti-white: #F6F7ED;` |
| **Spring** | `#DBE64C` | Brand accent, active stage indicator, badges, oven glows | `--color-spring: #DBE64C;` |
| **Midnight Mirage**| `#001F3F` | Deep header, typography, dark operational sidebar | `--color-midnight-mirage: #001F3F;` |
| **Mantis** | `#74C365` | Secondary accent, healthy stock pills, completed stages | `--color-mantis: #74C365;` |
| **Book Green** | `#00804C` | Primary CTA buttons, verified payment badges, completed timeline steps | `--color-book-green: #00804C;` |
| **Nuit Blanche** | `#1E488F` | Informational cards, links, secondary actions | `--color-nuit-blanche: #1E488F;` |

### Typography & Currency Standards
- **Headings & Display**: `Outfit`, Google Fonts (`font-display`)
- **Body & Forms**: `Plus Jakarta Sans`, Google Fonts (`font-sans`)
- **Editorial Accents**: `Playfair Display`, Google Fonts (`font-serif-brand`)
- **Monospace Code/Receipts**: `JetBrains Mono` / monospace
- **Currency**: Displayed in **INR (₹)** throughout the UI, stored and calculated exclusively in integer **paise** (`1 INR = 100 paise`).

---

## 🏗️ 3. Complete Project Structure

```text
WebDev-L3-PizzaDelivery/
├── package.json                         # Monorepo root scripts & dev dependencies
├── README.md                            # Complete technical documentation
├── .gitignore                           # Git ignore rules (node_modules, .env, build artifacts)
├── test-auth.js                         # Part 1 standalone auth test suite (11/11 passed)
├── test-part2-backend.js                # Part 2 catalog & cart test suite (13/13 passed)
│
├── client/                              # Frontend (React 19, Vite, Tailwind CSS v4, Socket.IO Client)
│   ├── dist/                            # Production bundle output
│   ├── src/
│   │   ├── components/
│   │   │   ├── cart/
│   │   │   │   └── CartDrawer.jsx       # Slide-over cart drawer with free delivery progress & controls
│   │   │   ├── common/
│   │   │   │   ├── Button.jsx           # Reusable button with 6-color variants & loading spinner
│   │   │   │   ├── Input.jsx            # Form input with floating labels & password toggle
│   │   │   │   ├── Badge.jsx            # Semantic dietary & status pills
│   │   │   │   ├── SkeletonLoader.jsx   # Shimmering loading skeletons
│   │   │   │   ├── Navbar.jsx           # Customer header with cart count & interactive dropdown
│   │   │   │   └── Footer.jsx           # Artisanal footer with hours, links, and story
│   │   │   └── pizza/
│   │   │       ├── PizzaCard.jsx        # Menu item card with imagery, price & customization trigger
│   │   │       └── PizzaDetailModal.jsx # Detailed ingredient breakdown modal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # User session, login, logout, verification state
│   │   │   └── CartContext.jsx          # Shopping cart state, token persistence, and drawer control
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx           # Customer storefront layout wrapper
│   │   │   └── AdminLayout.jsx          # Role-protected administration layout with Midnight Mirage sidebar
│   │   ├── pages/
│   │   │   ├── Home.jsx                 # Landing page with hero, master recipes, and steps
│   │   │   ├── Menu.jsx                 # Full menu with category tabs, search & filter
│   │   │   ├── Builder.jsx              # 4-step custom pizza builder with real-time price preview
│   │   │   ├── Cart.jsx                 # Full dedicated shopping cart page
│   │   │   ├── Checkout.jsx             # Delivery address form & Razorpay test-mode integration
│   │   │   ├── OrderConfirmation.jsx    # Post-checkout receipt with real-time baking progress tracker
│   │   │   ├── Dashboard.jsx            # Customer dashboard with real-time tracking, timeline, and reordering
│   │   │   ├── Orders.jsx               # Order history overview
│   │   │   ├── Login.jsx                # Customer login with unverified email recovery
│   │   │   ├── Register.jsx             # Customer registration with password strength meter
│   │   │   ├── VerifyEmail.jsx          # Tokenized email verification screen
│   │   │   ├── ForgotPassword.jsx       # Non-enumerating password reset request
│   │   │   ├── ResetPassword.jsx        # Password reset confirmation
│   │   │   ├── Profile.jsx              # Account profile & security management
│   │   │   ├── NotFound.jsx             # 404 "Slice Not Found" page
│   │   │   └── admin/
│   │   │       ├── AdminLogin.jsx       # Dedicated admin authentication screen
│   │   │       ├── AdminDashboard.jsx   # Command center with real-time metrics & low-stock scan
│   │   │       ├── AdminInventory.jsx   # Full recipe inventory ledger with real-time stock sync
│   │   │       ├── AdminOrders.jsx      # Live kitchen order queue with validated status transitions
│   │   │       ├── AdminAdjustments.jsx # Audit trail of manual stock adjustments
│   │   │       └── AdminAlerts.jsx      # Low-stock email notification audit history
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx            # Central router declaring customer & admin routes
│   │   ├── services/
│   │   │   ├── api.js                   # Axios client with credentials & error normalization
│   │   │   ├── auth.service.js          # Authentication endpoints
│   │   │   ├── pizza.service.js         # Pizzas, ingredients, pricing & cart operations
│   │   │   ├── orderService.js          # Orders, checkout & Razorpay payment verification
│   │   │   ├── admin.service.js         # Administrative metrics, inventory & status updates
│   │   │   └── socket.service.js        # Socket.IO singleton with reconnection & polling fallback
│   │   ├── utils/
│   │   │   └── pricing.js               # Integer-paise pricing calculations & INR formatting
│   │   └── styles/
│   │       └── index.css                # CSS variables, Tailwind tokens & animations
│   ├── vite.config.js                   # Vite configuration
│   └── package.json                     # Client dependencies
│
└── server/                              # Backend (Node.js, Express, Socket.IO, Mongoose, node-cron)
    ├── test-part3-orders.js             # Part 3 checkout, payment & inventory test suite (32/32 passed)
    ├── test-part4-admin.js              # Part 4 admin auth, inventory & cron test suite (33/33 passed)
    ├── test-part5-e2e.js                # Part 5 Socket.IO security, E2E journey & polling (36/36 passed)
    ├── src/
    │   ├── server.js                    # HTTP server entrypoint binding Express & Socket.IO
    │   ├── app.js                       # Express configuration, CORS, Helmet, cookie-parser
    │   ├── socket/
    │   │   └── index.js                 # Socket.IO initialization, JWT auth middleware, emitters
    │   ├── config/
    │   │   ├── env.js                   # Zod-validated environment configuration
    │   │   ├── db.js                    # Dual-mode Mongoose connection with graceful memory fallback
    │   │   └── mail.js                  # Nodemailer transporter with Ethereal dev fallback
    │   ├── models/
    │   │   ├── User.js                  # User schema with bcrypt password hashing & token verification
    │   │   ├── Pizza.js                 # Catalog pizza schema with basePricePaise & availability
    │   │   ├── Ingredient.js            # Customizable ingredient schema (crust, sauce, cheese, veggie)
    │   │   ├── Cart.js                  # Cart schema with item snapshots & pricing recalculation
    │   │   ├── Order.js                 # Authoritative order model, status transitions & audit trail
    │   │   ├── InventoryItem.js         # Inventory ledger tracking current stock & low-stock thresholds
    │   │   ├── StockAdjustment.js       # Immutable audit logs for manual inventory adjustments
    │   │   └── LowStockAlert.js         # Deduplicated low-stock email alert logs
    │   ├── controllers/
    │   │   ├── auth.controller.js       # Customer registration, verification, login, password recovery
    │   │   ├── pizza.controller.js      # Pizza catalog endpoints
    │   │   ├── ingredient.controller.js # Ingredient catalog endpoints
    │   │   ├── pricing.controller.js    # Pricing recalculation endpoint
    │   │   ├── cart.controller.js       # Persistent cart management
    │   │   ├── order.controller.js      # Checkout, Razorpay signature verification & cancellation
    │   │   └── admin.controller.js      # Admin auth, dashboard metrics, inventory CRUD & order dispatch
    │   ├── routes/
    │   │   ├── index.js                 # Master router mounting all modules & /api/health
    │   │   ├── auth.routes.js           # Auth routes
    │   │   ├── pizza.routes.js          # Pizza catalog routes
    │   │   ├── ingredient.routes.js     # Ingredient catalog routes
    │   │   ├── pricing.routes.js        # Pricing engine routes
    │   │   ├── cart.routes.js           # Cart routes
    │   │   ├── order.routes.js          # Order & Razorpay webhook routes
    │   │   ├── admin.routes.js          # Protected admin routes
    │   │   └── tracking.routes.js       # Authoritative REST tracking & polling fallback route
    │   ├── services/
    │   │   ├── auth.service.js          # Auth business logic
    │   │   ├── mail.service.js          # Transactional email rendering & dispatch
    │   │   ├── razorpay.service.js      # Razorpay order generation & HMAC-SHA256 verification
    │   │   ├── inventory.service.js     # Stock deduction, reservation, release & metrics
    │   │   ├── order.service.js         # Order creation & payment verification
    │   │   └── scheduler.service.js     # node-cron scheduled low-stock watcher with deduplication
    │   ├── middleware/
    │   │   ├── auth.js                  # JWT authentication & role-based authorization
    │   │   ├── rateLimiter.js           # IP rate limiting
    │   │   ├── validate.js              # Request body Zod validator
    │   │   └── errorHandler.js          # Centralized error handling
    │   ├── scripts/
    │   │   └── seed.js                  # Initial database seeding for catalog, ingredients & admin
    │   └── utils/
    │       ├── crypto.js                # Cryptographic token hashing
    │       ├── pricing.js               # Authoritative pricing rules in integer paise
    │       └── response.js              # Standardized API response formatters
    └── package.json                     # Server dependencies
```

---

## ⚡ 4. Real-Time Architecture & Socket.IO Security

### 4.1 Connection Authentication
Socket connections require a verified JSON Web Token (JWT). The token is parsed from:
1. `socket.handshake.auth.token`
2. `socket.handshake.headers.authorization` (Bearer token)
3. `socket.handshake.headers.cookie` (`token` HTTP-only cookie)

```javascript
// server/src/socket/index.js
export const socketAuthMiddleware = async (socket, next) => {
  // Verifies token with env.JWT_SECRET
  // Looks up verified user in database/memory
  // Attaches socket.user = { id, email, name, role }
  // Rejects untrusted or expired connections with an explicit error
};
```

### 4.2 Room Authorization & Event Names
Private order updates are **never** broadcast globally. The server enforces strict room authorization:
- `order:subscribe`: Validates that `order.userId === socket.user.id` or `socket.user.role === 'admin'`. If unauthorized, rejects the subscription with a 403 response.
- `order:statusUpdated`: Emitted exclusively to `order:${orderId}` and `order:${orderNumber}` rooms.
- `admin:subscribe`: Validates that `socket.user.role === 'admin'`. Joins `admin:orders` and `admin:inventory`.
- `admin:orderUpdated` & `admin:newOrder`: Emitted to the `admin:orders` room.
- `admin:inventoryAlert` & `admin:stockChanged`: Emitted to the `admin:inventory` room.

### 4.3 Controlled Polling Fallback
If the WebSocket connection drops or cannot be established:
1. `socket.service.js` automatically starts a 5-second polling interval against `GET /api/tracking/:id`.
2. When the user switches tabs (`document.hidden === true`), polling is automatically suspended to conserve resources.
3. When the socket successfully reconnects, polling stops immediately.
4. When an order reaches a terminal state (`delivered` or `cancelled`), polling terminates.

---

## 📊 5. Database Models & Schema Summary

| Model | Key Fields | Indexes & Constraints |
| :--- | :--- | :--- |
| **User** | `name`, `email`, `passwordHash`, `role` (`user`, `admin`), `isEmailVerified`, `emailVerificationTokenHash`, `emailVerificationExpires`, `resetPasswordTokenHash`, `resetPasswordExpires` | Unique index on `email` |
| **Pizza** | `name`, `description`, `imageUrl`, `basePricePaise`, `category`, `isAvailable`, `isFeatured` | Text index on `name`, index on `category`, `isAvailable` |
| **Ingredient** | `name`, `category` (`base`, `sauce`, `cheese`, `veggie`), `priceAdjustmentPaise`, `isAvailable`, `isDefault` | Index on `category`, `isAvailable` |
| **Cart** | `userId`, `cartToken`, `items` (embedded snapshot), `updatedAt` | Sparse unique index on `userId`, unique index on `cartToken` |
| **Order** | `orderNumber` (e.g. `PV-20261019-XXXXXX`), `userId`, `items` (immutable snapshot), `deliveryAddress`, `subtotalPaise`, `deliveryFeePaise`, `taxPaise`, `grandTotalPaise`, `paymentStatus` (`pending`, `paid`, `failed`, `refunded`), `orderStatus` (`awaiting_payment`, `received`, `in_kitchen`, `sent_to_delivery`, `delivered`, `cancelled`), `razorpayOrderId`, `razorpayPaymentId`, `statusHistory` | Unique index on `orderNumber`, indexes on `userId`, `razorpayOrderId`, `orderStatus`, `paymentStatus` |
| **InventoryItem** | `name`, `category` (`pizza_base`, `sauce`, `cheese`, `vegetable`), `sku`, `currentStock`, `lowStockThreshold`, `unit`, `alertSentForLowStock`, `lastAlertSentAt`, `isActive` | Unique index on `sku`, index on `category`, `isActive` |
| **StockAdjustment** | `inventoryItemId`, `sku`, `itemName`, `previousStock`, `newStock`, `adjustmentAmount`, `reason`, `adjustedByUserId`, `adjustedByEmail`, `createdAt` | Index on `sku`, `inventoryItemId`, `createdAt` |
| **LowStockAlert** | `inventoryItemId`, `itemSku`, `itemName`, `currentStock`, `threshold`, `recipientEmail`, `status`, `deliveryOutcome`, `createdAt` | Index on `itemSku`, `createdAt` |

### Authoritative Order Status Lifecycle
```text
[ awaiting_payment ] 
       │ (Verified Razorpay Payment)
       ▼
   [ received ] ──(Admin)──► [ in_kitchen ] ──(Admin)──► [ sent_to_delivery ] ──(Admin)──► [ delivered ]
       │                           │                              │
       └───────────────────────────┴──────────────────────────────┴──────► [ cancelled ]
                                                                      (Restores Inventory)
```

---

## 🔌 6. API Route Summary

### Public / Storefront APIs
- `GET /api/health` — Service health check & Part 5 real-time feature flags
- `POST /api/auth/register` — Register a customer account
- `POST /api/auth/verify-email` — Verify email using cryptographic token
- `POST /api/auth/login` — Sign in and receive JWT session
- `POST /api/auth/logout` — Clear session cookie
- `POST /api/auth/forgot-password` — Request password reset
- `POST /api/auth/reset-password` — Confirm password reset
- `GET /api/auth/me` — Authenticated profile (protected)
- `GET /api/pizzas` — List menu catalog items
- `GET /api/pizzas/:id` — Single pizza details
- `GET /api/ingredients` — Grouped customizable ingredients (bases, sauces, cheeses, veggies)
- `POST /api/pricing/calculate-custom` — Authoritative price calculation for custom combinations
- `GET /api/cart` — Retrieve customer cart
- `POST /api/cart/items` — Add catalog or custom pizza to cart
- `PATCH /api/cart/items/:id` — Update item quantity
- `DELETE /api/cart/items/:id` — Remove item from cart
- `DELETE /api/cart` — Clear cart

### Customer Order & Real-Time Tracking APIs (Protected)
- `POST /api/orders/create-checkout` — Initialize pending order & Razorpay order
- `POST /api/orders/verify-payment` — Verify HMAC-SHA256 signature, mark paid, commit stock
- `GET /api/orders/my-orders` — Customer order history
- `GET /api/orders/:id` — Detailed order receipt
- `POST /api/orders/:id/cancel` — Cancel order and release reserved/committed stock
- `GET /api/tracking/:id` — Authoritative REST tracking endpoint (polling fallback)
- `POST /api/orders/webhook` — Razorpay webhook endpoint

### Administrator APIs (Protected: `role: 'admin'`)
- `POST /api/admin/auth/login` — Dedicated admin authentication
- `GET /api/admin/auth/me` — Current admin session verification
- `POST /api/admin/auth/logout` — Terminate admin session
- `GET /api/admin/dashboard/metrics` — Dashboard KPI metrics (stock levels, ovens, revenue)
- `GET /api/admin/inventory` — Full inventory ledger with filters & pagination
- `GET /api/admin/inventory/:id` — Single inventory item details
- `POST /api/admin/inventory` — Create new inventory item
- `PATCH /api/admin/inventory/:id` — Update item metadata or low-stock threshold
- `POST /api/admin/inventory/:id/adjust` — Manual stock adjustment with audit reason
- `GET /api/admin/inventory/adjustments` — Stock adjustment audit history
- `GET /api/admin/inventory/alerts` — Low-stock alert audit history
- `POST /api/admin/inventory/trigger-scan` — Trigger on-demand low-stock check
- `GET /api/admin/orders` — Admin order fulfillment queue
- `GET /api/admin/orders/:id` — Detailed order ticket
- `PATCH /api/admin/orders/:id/status` — Advance order status (`in_kitchen`, `sent_to_delivery`, `delivered`, `cancelled`)

---

## 🧪 7. Automated Test Execution Status

All test suites were executed against the running application and passed with a **100% success rate**:

| Test Suite | File | Tests Run | Result | Key Capabilities Verified |
| :--- | :--- | :---: | :---: | :--- |
| **Auth & Security** | `test-auth.js` | 11 / 11 | ✅ **PASSED** | Registration, duplicate rejection, unverified login block, tokenized email verification, profile retrieval, password reset flow, logout |
| **Catalog, Builder & Cart** | `test-part2-backend.js` | 13 / 13 | ✅ **PASSED** | Catalog listing, out-of-stock rejection, 4-category ingredient loading, custom pizza calculation, cart addition, quantity updates, free delivery progress, cart clearing |
| **Orders & Razorpay** | `server/test-part3-orders.js` | 32 / 32 | ✅ **PASSED** | Checkout order generation, Razorpay order creation, integer paise calculations, forged signature rejection, valid HMAC-SHA256 verification, idempotency guard, stock commitment, order cancellation stock release |
| **Admin Operations** | `server/test-part4-admin.js` | 33 / 33 | ✅ **PASSED** | Dedicated admin authentication, role protection (403 for non-admins), inventory CRUD, threshold updates, manual adjustment audits, recipe ingredient deduction, node-cron alert deduplication, admin order workflow |
| **Real-Time & E2E** | `server/test-part5-e2e.js` | 36 / 36 | ✅ **PASSED** | Socket.IO JWT authentication, unauthenticated rejection, room authorization (intruder block), customer order room subscription, Razorpay payment verification, real-time status transitions (`in_kitchen` ➔ `sent_to_delivery` ➔ `delivered`), REST polling fallback, real-time stock change broadcasts, manual scan |
| **Frontend Production Build** | `npm run build --prefix client` | Clean | ✅ **PASSED** | Vite production bundle built in 3.92s with zero JSX/JS errors |

**Total Backend & Integration Tests: 125 Passed, 0 Failed (100% Success Rate).**

---

## ⚙️ 8. Environment Configuration Checklist

Create a `.env` file in `server/` before starting the application:

```env
# Node Environment
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

# Database Connection
# If MongoDB is unavailable locally, the application automatically activates
# high-performance zero-config in-memory Map repositories.
MONGODB_URI=mongodb://127.0.0.1:27017/pizzaverse

# Authentication Secrets
JWT_SECRET=pv_jwt_super_secret_production_key_change_in_prod_2026!
JWT_EXPIRES_IN=7d
COOKIE_SECRET=pv_cookie_signing_secret_production_2026!

# Razorpay Test / Live Credentials
RAZORPAY_KEY_ID=rzp_test_YourTestKeyId1234
RAZORPAY_KEY_SECRET=pv_sec_test_SecretKey2026
RAZORPAY_WEBHOOK_SECRET=pv_whsec_test_Secret2026

# SMTP Mail Delivery
# Leave empty in development to automatically use ephemeral Ethereal accounts
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="PizzaVerse Artisanal Pizzeria" <orders@pizzaverse.local>
ADMIN_NOTIFICATION_EMAIL=admin@pizzaverse.local

# Automated Inventory Scheduler
INVENTORY_CHECK_CRON=0 * * * *
```

Create a `.env` file in `client/`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🚀 9. Getting Started & Running Locally

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- (Optional) MongoDB daemon running on `mongodb://127.0.0.1:27017`

### Step 1: Install Dependencies
From the repository root:
```bash
# Install root monorepo dependencies
npm install

# Install server dependencies
npm install --prefix server

# Install client dependencies
npm install --prefix client --legacy-peer-deps
```

### Step 2: Start the Servers
You can start both frontend and backend concurrently or in separate terminals:

```bash
# Terminal 1: Backend Server (Port 5000)
cd server
node src/server.js

# Terminal 2: Frontend Client (Port 5173)
cd client
npm run dev
```

### Step 3: Default Credentials
The application automatically provisions an administrator account upon startup:
- **Admin Dashboard**: `http://localhost:5173/admin/login`
  - Email: `admin@pizzaverse.local`
  - Password: `AdminMasterPass2026!`
- **Customer Storefront**: `http://localhost:5173`
  - New customers can register at `http://localhost:5173/register`
  - In development mode, the verification token is logged to the console and previewable via Ethereal Mail.

---

## 🔒 10. Production Readiness & Security Checklist

Before deploying PizzaVerse to a production environment:

1. **Environment Variables**:
   - Set `NODE_ENV=production`.
   - Replace `JWT_SECRET` and `COOKIE_SECRET` with cryptographically generated random strings (min 64 chars).
   - Set `CLIENT_URL` to your production domain (e.g. `https://pizzaverse.yourdomain.com`).
2. **CORS & Cookies**:
   - In production, cookies are automatically set with `secure: true`, `httpOnly: true`, and `sameSite: 'none'` (or `'lax'` if served on same root domain).
   - Verify that your load balancer or reverse proxy passes `X-Forwarded-Proto: https`.
3. **Database Configuration**:
   - Provide a managed MongoDB replica set connection string (`MONGODB_URI`) with TLS enabled (e.g., MongoDB Atlas).
   - Ensure MongoDB indexes are created:
     ```javascript
     db.users.createIndex({ email: 1 }, { unique: true });
     db.orders.createIndex({ orderNumber: 1 }, { unique: true });
     db.orders.createIndex({ userId: 1 });
     db.orders.createIndex({ razorpayOrderId: 1 });
     db.inventoryitems.createIndex({ sku: 1 }, { unique: true });
     ```
   - Automated daily snapshots and point-in-time recovery (PITR) must be configured in your cloud database provider.
4. **Razorpay Live Migration**:
   - Switch `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from test (`rzp_test_...`) to live (`rzp_live_...`).
   - Configure your live webhook endpoint (`https://api.yourdomain.com/api/orders/webhook`) in the Razorpay Dashboard.
   - Enter your live webhook secret in `RAZORPAY_WEBHOOK_SECRET`.
5. **SMTP Mail Delivery**:
   - Configure a production transactional email provider (SendGrid, AWS SES, Resend, or Mailgun).
   - Configure SPF, DKIM, and DMARC DNS records for your sender domain to ensure reliable delivery to inbox.
6. **Graceful Shutdown**:
   - The application traps `SIGTERM` and `SIGINT` signals, closes the active node-cron scheduler, closes all active Socket.IO connections, stops accepting new HTTP connections, and cleanly closes the database connection pool.
7. **Process Management**:
   - Run the server using PM2 or a container orchestrator (Kubernetes, ECS):
     ```bash
     pm2 start server/src/server.js --name pizzaverse-api -i max
     ```

---

## 🛡️ 11. Known Limitations & Future Roadmap

1. **Multi-Node Socket.IO Scaling**:
   - In a multi-instance container deployment behind a load balancer, attach `@socket.io/redis-adapter` so that order update events are fanned out across all running node instances.
2. **Push Notifications**:
   - Mobile web push notifications (Web Push API) for background notifications when the customer's browser is closed.
3. **Live Geolocation Tracking**:
   - Integration with courier GPS mobile apps for live turn-by-turn map coordinates on the delivery stage.

---

*PizzaVerse is engineered with passion for artisanal Italian wood-fired pizza and enterprise software craftsmanship.*
