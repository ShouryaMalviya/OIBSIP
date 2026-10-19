# 🍕 PizzaVerse — Premium Artisanal Pizza Platform

> **Parts 1 & 2 Completed: Enterprise Monorepo, Six-Colour Design System, Cryptographic Authentication, Pizza Catalog, 4-Step Custom Pizza Builder, Authoritative Pricing Engine, & Shopping Cart**

---

## 📖 Executive Summary

**PizzaVerse** is an enterprise-grade full-stack pizza ordering, customization, payment, order tracking, and inventory management platform. 

This repository contains the complete implementation of **Part 1 & Part 2 of 5**:
- **Design System**: Six-colour curated contemporary pizzeria palette (Praxeti White, Spring, Midnight Mirage, Mantis, Book Green, Nuit Blanche).
- **Core Authentication**: bcryptjs hashing, SHA-256 tokenized email verification, and HTTP-only JWT sessions.
- **Database-Backed Pizza Catalog**: Seeded with 8 sample artisanal pizzas with availability flags, categories, and INR pricing.
- **4-Step Custom Pizza Builder**: Interactive crust, sauce, cheese, and multiple vegetable selections with real-time visual canvas and dynamic price estimation.
- **Authoritative Pricing Engine**: Strictly uses integer paise (1 INR = 100 paise) to prevent floating-point currency errors. All prices are calculated and validated against verified database records.
- **Shopping Cart**: Full cart drawer and dedicated cart page with real-time quantity updates, custom pizza editing, free delivery progress bar, 5% GST calculation, and transparent pricing.

---

## 🎨 Design System & Brand Identity

The application strictly implements the curated six-colour palette across all UI components and email templates:

| Token Name | Hex Code | Semantic Role | Reusable CSS Variable |
| :--- | :--- | :--- | :--- |
| **Praxeti White** | `#F6F7ED` | Main application background, warm editorial canvas | `--color-praxeti-white: #F6F7ED;` |
| **Spring** | `#DBE64C` | Brand accent, badges, ratings, highlights | `--color-spring: #DBE64C;` |
| **Midnight Mirage**| `#001F3F` | Deep header, typography, primary surfaces | `--color-midnight-mirage: #001F3F;` |
| **Mantis** | `#74C365` | Secondary accent, status badges, herb tones | `--color-mantis: #74C365;` |
| **Book Green** | `#00804C` | Primary CTA buttons, success indicators | `--color-book-green: #00804C;` |
| **Nuit Blanche** | `#1E488F` | Active states, hover transitions, borders | `--color-nuit-blanche: #1E488F;` |

### Typography & Currency
- **Headings & Display**: `Outfit`, Google Fonts (`font-display`)
- **Body & Forms**: `Plus Jakarta Sans`, Google Fonts (`font-sans`)
- **Editorial Accents**: `Playfair Display`, Google Fonts (`font-serif-brand`)
- **Currency**: Displayed in **INR (₹)** throughout the application, backed by integer **paise** storage.

---

## 📂 Monorepo Architecture

```text
pizzaverse/
├── package.json                         # Monorepo orchestrator (concurrently)
├── README.md                            # Comprehensive technical documentation
├── .gitignore                           # Git ignore definitions
├── test-auth.js                         # Part 1 end-to-end auth test script
├── test-part2-backend.js                # Part 2 catalog, builder, pricing & cart test script
│
├── client/                              # Frontend (React 19, Vite, Tailwind CSS v4)
│   ├── src/
│   │   ├── components/
│   │   │   ├── cart/
│   │   │   │   └── CartDrawer.jsx       # Slide-over cart drawer with free delivery progress & controls
│   │   │   ├── common/
│   │   │   │   ├── Button.jsx           # Reusable button with brand variants & loading spinner
│   │   │   │   ├── Input.jsx            # Form input with floating labels & password toggle
│   │   │   │   ├── Badge.jsx            # Dietary & authorization status tags
│   │   │   │   ├── SkeletonLoader.jsx   # Shimmering loading skeletons
│   │   │   │   ├── Navbar.jsx           # Header with interactive cart count & responsive drawer
│   │   │   │   └── Footer.jsx           # Artisanal brand story, wood-fired hours, links
│   │   │   └── pizza/
│   │   │       ├── PizzaCard.jsx        # Food photography, INR price, Add to Cart & Customize actions
│   │   │       └── PizzaDetailModal.jsx # Detail modal with ingredients, allergens & pricing
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # Context API managing user session, login, logout, verification
│   │   │   └── CartContext.jsx          # Context API managing cart items, drawer state, and totals
│   │   ├── data/
│   │   │   └── pizzas.js                # Fallback artisanal pizza catalog with INR paise pricing
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx           # App layout wrapper with Navbar, CartDrawer, and Footer
│   │   ├── pages/
│   │   │   ├── Home.jsx                 # Hero, master pizzas, 4-step craft, benefits & CTAs
│   │   │   ├── Menu.jsx                 # Catalog with category tabs, search & dietary toggles
│   │   │   ├── Builder.jsx              # 4-step interactive pizza builder with visual canvas
│   │   │   ├── Cart.jsx                 # Full dedicated shopping cart page
│   │   │   ├── Login.jsx                # Login form with unverified email alert & resend button
│   │   │   ├── Register.jsx             # Register with 5-point live password strength meter
│   │   │   ├── VerifyEmail.jsx          # Cryptographic token verification & resend handler
│   │   │   ├── ForgotPassword.jsx       # Non-enumerating password reset request
│   │   │   ├── ResetPassword.jsx        # Strong password reset confirmation
│   │   │   ├── Profile.jsx              # Authenticated user account & security overview
│   │   │   └── NotFound.jsx             # Branded 404 ("Slice Not Found")
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx            # Centralized client router (React Router DOM)
│   │   ├── services/
│   │   │   ├── api.js                   # Centralized Axios client with credentials & interceptors
│   │   │   ├── auth.service.js          # Authentication service
│   │   │   └── pizza.service.js         # Pizzas, ingredients, pricing & cart service
│   │   ├── utils/
│   │   │   └── pricing.js               # Frontend pricing calculations in INR paise
│   │   └── styles/
│   │       └── index.css                # Six-color CSS variables, Tailwind tokens & animations
│   ├── vite.config.js                   # Vite configuration
│   └── package.json                     # Client dependencies
│
└── server/                              # Backend (Node.js, Express, Mongoose, JWT)
    └── src/
        ├── config/
        │   ├── db.js                    # Dual Mongoose/Memory connector with fast dev failover
        │   ├── env.js                   # Environment configuration & validation
        │   └── mail.js                  # Nodemailer transporter with Ethereal dev previews
        ├── controllers/
        │   ├── auth.controller.js       # Authentication controller
        │   ├── pizza.controller.js      # Pizza catalog controller with search & filtering
        │   ├── ingredient.controller.js # Builder ingredient controller
        │   ├── pricing.controller.js    # Authoritative price calculation controller
        │   └── cart.controller.js       # Shopping cart controller with quantity & stale item checks
        ├── middleware/
        │   ├── auth.js                  # JWT authentication & optionalAuthenticate middleware
        │   ├── errorHandler.js          # Centralized error handler & 404 handler
        │   └── rateLimiter.js           # Express rate limiting for sensitive endpoints
        ├── models/
        │   ├── User.js                  # User model (bcrypt, dual storage)
        │   ├── Pizza.js                 # Pizza catalog model (dual storage)
        │   ├── Ingredient.js            # Builder ingredient model (dual storage)
        │   └── Cart.js                  # Cart model (dual storage)
        ├── routes/
        │   ├── auth.routes.js           # Auth routes
        │   ├── pizza.routes.js          # Pizza catalog routes
        │   ├── ingredient.routes.js     # Ingredient options routes
        │   ├── pricing.routes.js        # Price calculation routes
        │   ├── cart.routes.js           # Cart routes
        │   └── index.js                 # Extensible master API router
        ├── scripts/
        │   └── seed.js                  # Sample data seeder (8 pizzas, 23 ingredients)
        ├── services/
        │   ├── auth.service.js          # Auth business logic
        │   └── mail.service.js          # Branded HTML email templates
        ├── utils/
        │   ├── pricing.js               # Authoritative pricing engine in integer paise
        │   ├── crypto.js                # Cryptographic token generator & SHA-256 hasher
        │   └── response.js              # Standardized API response formatters
        ├── app.js                       # Express app with Helmet, CORS & cookies
        └── server.js                    # Server startup with auto-seeding
```

---

## 🍕 4-Step Custom Pizza Builder

The Custom Pizza Builder (`/builder`) provides a four-step custom pizza crafting journey:

### STEP 1 — Choose a Base (Crust)
1. **Classic Thin Crust** (`₹0` adjustment) — Crisp European stone-baked thin crust.
2. **Hand-Tossed Sourdough** (`+₹30` adjustment) — 48h cold fermented sourdough with blistered cornicione.
3. **Golden Pan Crust** (`+₹40` adjustment) — Thick, fluffy base fried in olive oil.
4. **Whole Wheat Organic** (`+₹50` adjustment) — Stone-ground 100% whole wheat dough.
5. **Molten Cheese Burst** (`+₹80` adjustment) — Double crust filled with molten cheese.

### STEP 2 — Choose a Sauce Canvas
1. **Classic Tomato** (`₹0` adjustment) — Slow-simmered San Marzano tomatoes and basil.
2. **Spicy Marinara** (`+₹20` adjustment) — Red chilies, roasted garlic, and plum tomatoes.
3. **Creamy Alfredo White** (`+₹30` adjustment) — Velvety butter, cream, and Parmigiano.
4. **Aromatic Basil Pesto** (`+₹40` adjustment) — Fresh Ligurian basil, pine nuts, and pecorino.
5. **Smoky Barbecue** (`+₹30` adjustment) — Oak-smoked tomato sauce with sweet molasses.

### STEP 3 — Choose Cheese (Single Selection)
1. **Fresh Fior di Latte Mozzarella** (`₹0` adjustment) — Artisanal fresh mozzarella with golden pull.
2. **Sharp Aged Cheddar** (`+₹40` adjustment) — 12-month aged English cheddar.
3. **Parmigiano Reggiano DOP** (`+₹50` adjustment) — 24-month aged authentic Italian parmesan.
4. **Plant-Based Vegan Cheese** (`+₹60` adjustment) — Cultured cashew and coconut milk mozzarella.

### STEP 4 — Choose Vegetables (Multiple Selection)
1. **Red Onion Rings** (`+₹25`)
2. **Crunchy Capsicum** (`+₹25`)
3. **Wild Button Mushrooms** (`+₹35`)
4. **Golden Sweet Corn** (`+₹30`)
5. **Ripe Roma Tomatoes** (`+₹20`)
6. **Kalamata Black Olives** (`+₹35`)
7. **Pickled Fiery Jalapeños** (`+₹30`)
8. **Tender Baby Spinach** (`+₹25`)
9. **Hawaiian Honey Pineapple** (`+₹30`)

### Interactive Visual Canvas & Review
- Real-time layered visual illustration showing crust shade, sauce tint, cheese melt, and selected vegetable chips.
- Step-by-step validation ensuring required ingredients are chosen before proceeding.
- Live price updating instantly in INR.
- Edit mode: Loads existing custom pizzas directly from the cart into the builder via `?editCartItem=<id>`.

---

## 💰 Authoritative Pricing Engine

To avoid floating-point inaccuracies, the pricing engine computes and stores all currency in **integer paise** (1 INR = 100 paise):

$$\text{Unit Price (paise)} = \text{basePricePaise} + \text{crustAdj} + \text{sauceAdj} + \text{cheeseAdj} + \sum \text{veggieAdjs}$$

- **Base Custom Pizza Price**: ₹199 (`19900` paise)
- **Delivery Fee Policy**:
  - Orders under ₹500 (`50000` paise): ₹49 (`4900` paise) delivery fee.
  - Orders ₹500 and above: **FREE Flash Delivery** (`₹0`).
- **Taxes**: 5% GST (`Math.round(subtotalPaise * 0.05)`)
- **Grand Total**: `subtotalPaise + deliveryFeePaise + taxPaise`
- **Security Rule**: The backend recalculates and verifies all ingredient adjustments using database records. Client-submitted prices are never trusted.

---

## 📡 API Specification Reference

All endpoints return standardized JSON:
- **Success**: `{ success: true, message: string, data?: any }`
- **Error**: `{ success: false, message: string, errors?: object }`

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Service health & version heartbeat (`2.0.0`) |
| `GET` | `/api/pizzas` | Public | Retrieve catalog pizzas with filters (`category`, `search`, `featured`) |
| `GET` | `/api/pizzas/:id` | Public | Retrieve detailed pizza information |
| `GET` | `/api/ingredients` | Public | Retrieve all customizable builder ingredients grouped by category |
| `POST` | `/api/pricing/calculate-custom`| Public | Authoritative custom pizza price calculation from verified DB records |
| `GET` | `/api/cart` | Public/Auth | Retrieve current cart with fresh DB prices and availability flags |
| `POST` | `/api/cart/items` | Public/Auth | Add catalog pizza or custom pizza to cart |
| `PATCH`| `/api/cart/items/:itemId` | Public/Auth | Update quantity of a cart item (1–20) |
| `PUT` | `/api/cart/items/:itemId/custom`| Public/Auth | Edit custom pizza ingredient selections |
| `DELETE`| `/api/cart/items/:itemId` | Public/Auth | Remove an item from the cart |
| `DELETE`| `/api/cart` | Public/Auth | Clear all items from the cart |

---

## 🧪 Verification & Test Results

### 1. Automated Test Execution
Run both test suites against the live server:
```bash
# Part 1 Auth Test Suite
node test-auth.js

# Part 2 Catalog, Builder, Pricing & Cart Test Suite
node test-part2-backend.js
```

**Test Execution Results:**
```text
--- STARTING PART 2 BACKEND VERIFICATION ---
[1] Testing GET /api/pizzas... -> 200 OK (8 Sample Pizzas verified)
[2] Testing GET /api/pizzas/:id... -> 200 OK (Margherita Classica)
[3] Testing GET /api/pizzas?search=paneer... -> 200 OK (Spicy Paneer Tikka Feast)
[4] Testing GET /api/ingredients... -> 200 OK (23 Ingredients: 5 Bases, 5 Sauces, 4 Cheeses, 9 Veggies)
[5] Testing POST /api/pricing/calculate-custom... -> 200 OK (Unit price: ₹374 = 37400 paise)
[6] Testing GET /api/cart... -> 200 OK (Cart initialized with token)
[7] Testing POST /api/cart/items (Catalog pizza: Margherita)... -> 201 Created (Subtotal: ₹299)
[8] Testing rejection of Out-of-Stock pizza... -> 400 Bad Request (Mediterranean Veg rejected)
[9] Testing POST /api/cart/items (Custom pizza)... -> 201 Created (Subtotal: ₹673, Delivery Fee: FREE)
[10] Testing PATCH /api/cart/items/:itemId (Update quantity)... -> 200 OK (Quantity: 2)
[11] Testing PUT /api/cart/items/:itemId/custom (Edit custom pizza)... -> 200 OK (New Subtotal: ₹927)
[12] Testing DELETE /api/cart/items/:itemId... -> 200 OK (Item removed)
[13] Testing DELETE /api/cart (Clear Cart)... -> 200 OK (Cart emptied)
--- ALL PART 2 BACKEND ENDPOINTS & PRICING VERIFICATIONS PASSED! ---
```

### 2. Frontend Production Build Verification
```bash
npm run build --prefix client
```
Output:
```text
✓ 2016 modules transformed.
dist/index.html                   1.37 kB │ gzip:   0.76 kB
dist/assets/index-T30GFPSL.css   56.35 kB │ gzip:  10.22 kB
dist/assets/index-FQr0GA0z.js   491.08 kB │ gzip: 147.72 kB
✓ built in 333ms
```

---

## 🚀 Startup Commands

From the workspace root:
```bash
# Start both client and server concurrently
npm run dev

# Or start individually:
npm run dev:server   # http://localhost:5000
npm run dev:client   # http://localhost:5173
```

---

## 📋 Continuation Contract for Part 3

Part 2 is complete. All source files, schemas, and endpoints are active and ready for:

- **Part 3**: Order Creation, Delivery Address Collection, Order Summary, Inventory Reservation, and **Razorpay Test-Mode Payment Gateway Integration**.

### Exact Next Prompt to Continue to Part 3:
```text
Act as a senior full-stack software engineer, system architect, and security-conscious developer.

Continue building PizzaVerse by implementing Part 3 of 5: "Order Summary, Delivery Address, Inventory Reservation, and Razorpay Test-Mode Checkout".

Extend the existing Part 1 & Part 2 architecture without rewriting or breaking the established authentication system, User model, Pizza catalog, Custom Pizza Builder, Cart, or six-colour design system.

Implement:
1. Backend Order & Payment Architecture:
   - Order Schema & Model (orderNumber, user, items, deliveryAddress, subtotalPaise, deliveryFeePaise, taxPaise, grandTotalPaise, orderStatus: ['placed', 'preparing', 'baking', 'out_for_delivery', 'delivered', 'cancelled'], paymentStatus: ['pending', 'paid', 'failed'], razorpayOrderId, razorpayPaymentId, razorpaySignature).
   - Razorpay API integration in test mode (order creation and HMAC SHA-256 webhook/signature verification).
   - POST /api/orders/create-checkout: validates cart items, reserves stock, creates Razorpay order, returns order tokens.
   - POST /api/orders/verify-payment: verifies razorpay_signature using crypto HMAC SHA-256, marks order as paid, clears the cart.
   - GET /api/orders/my-orders: authenticated customer order history.
   - GET /api/orders/:id: single order lookup with receipt details.

2. Frontend Checkout & Payment Workflow:
   - Dedicated checkout page (/checkout) with delivery address form (street, city, state, postal code, phone, delivery notes) using React Hook Form.
   - Order review summary showing cart items, delivery fee, 5% GST, and grand total in INR.
   - Seamless Razorpay Checkout modal integration with test cards/UPI simulation.
   - Order confirmation success page (/order-confirmation/:orderId) displaying order number, estimated delivery time, receipt breakdown, and link to track order.
   - Order history tab in customer Profile (/profile).

Maintain full compatibility with Parts 1 and 2.
```
