# AuthVault — Secure Authentication System
## Part 2: Login Engine, Session Lifecycle & Protected Dashboard

AuthVault is a modern, responsive client-side authentication system built with vanilla web technologies and designed with a bespoke maroon and burgundy aesthetic.

> **Project Phase:** Part 2 of 3  
> **Tech Stack:** HTML5, CSS3 (Vanilla Design System), JavaScript (ES6+ Vanilla), Browser `localStorage`, `sessionStorage`, and native Web Crypto API (`crypto.subtle`).  
> **No External Frameworks:** Pure vanilla implementation without React, TypeScript, Tailwind, Bootstrap, or build dependencies.

---

## 1. Project Directory Structure

```
AuthVault/
├── index.html          # Login portal page & entry point (Part 2 active)
├── register.html       # Account creation & client-side registration engine (Part 1 active)
├── dashboard.html      # Protected user dashboard with session verification guard (Part 2 active)
├── css/
│   └── style.css       # Unified design system, CSS variables & animations
├── js/
│   ├── auth.js         # Cryptographic hashing, validation, session & login controllers
│   └── dashboard.js    # Protected dashboard session verification & logout handler
└── README.md           # Architecture, testing checklist & security documentation
```

---

## 2. Part 2 Architecture & Enhancements

### Feature 1: Login Portal (`index.html`)
- Built using the same glassmorphism card, typography, and maroon aesthetic as `register.html`.
- Allows authentication via either **username** or **email address**.
- Real-time password visibility toggle.
- Asynchronous loading state on submission button with animated spinner.
- Accessible error area using `textContent` for dynamic feedback.

### Feature 2: Credential Verification (`js/auth.js`)
- Rejects empty submissions before processing.
- Performs case-insensitive matching (`.toLowerCase()`) against accounts stored in `localStorage['authVaultUsers']`.
- Computes SHA-256 hash using the native browser **Web Crypto API** (`crypto.subtle.digest`).
- Compares computed hash directly against stored password hash.
- **Uniform Error Handling:** If credentials fail or account is missing, displays the identical message:
  `"Invalid username/email or password."`  
  *(Eliminates user enumeration vectors).*

### Feature 3: Active Session Management (`sessionStorage: authVaultSession`)
- Upon successful authentication, creates an isolated session in `sessionStorage` under the key:
  **`authVaultSession`**
- **Zero Plaintext / Zero Hashes:** Contains only the minimum required metadata:
  ```json
  {
    "username": "alex_rivera",
    "email": "alex@example.com",
    "loggedInAt": "2026-10-18T00:25:00.000Z"
  }
  ```
- Persisted only in the active browser tab/session (destroyed when tab or browser closes).

### Feature 4: Protected Dashboard & Route Guards (`dashboard.html` & `js/dashboard.js`)
- Gated visibility: Dashboard wrapper is completely hidden by default until `js/dashboard.js` validates `sessionStorage['authVaultSession']`.
- If no session exists: Immediately redirects to `index.html` via `window.location.replace` without flashing protected content.
- If session exists: Renders dashboard, displaying personalized welcome message, username, email, and session timestamp strictly via `textContent`.
- Active authentication indicator badge with pulsating emerald glow.

### Feature 5: Secure Sign-Out Flow
- Clicking **Sign Out**:
  1. Purges `authVaultSession` from `sessionStorage`.
  2. Replaces history entry and redirects to `index.html`.
  3. Guards against browser Back/Forward Cache (`pageshow` event with `event.persisted`) so ordinary browser navigation cannot reopen the dashboard without logging in again.

---

## 3. Security Architecture & Educational Disclosure

> **Educational Project Scope:**  
> This project is designed for demonstration and educational purposes.  
> 
> - **Client-Side Hashing Limitations:** While SHA-256 prevents plaintext storage in `localStorage`, SHA-256 is a general-purpose cryptographic hash function that is extremely fast on GPUs and ASICs. In a production environment, password authentication must occur server-side using slow, memory-hard, salted algorithms such as **Argon2id**, **bcrypt**, or **PBKDF2**.
> - **Client-Side Storage:** Browser `sessionStorage` and `localStorage` can be viewed or modified by anyone with access to developer tools. Client-side route guards demonstrate application state flow, not a cryptographically enforced authorization boundary. Production systems require secure, `HttpOnly`, `SameSite` cookies and TLS.
> - **XSS Immunity:** Untrusted inputs and error messages are rendered exclusively via `element.textContent`, preventing DOM-based cross-site scripting (XSS). `eval()` is strictly prohibited.
> - **URL Safety:** Form submissions intercept default behavior with `event.preventDefault()`, ensuring credentials never leak into URL queries or browser history.

---

## 4. Part 2 Verification and Testing Checklist

| # | Test Scenario | Steps | Expected Outcome |
|---|---|---|---|
| **1** | **Empty Login Submission** | Click "Sign In" with empty inputs | Blocked. Alert: "Please enter both your username/email and password." |
| **2** | **Invalid Credentials (Generic)** | Enter un registered user or wrong password | Spinner activates, then displays uniform generic error: "Invalid username/email or password." |
| **3** | **Login via Username** | Enter registered username + correct password | Authenticates, establishes session in `sessionStorage['authVaultSession']`, redirects to `dashboard.html`. |
| **4** | **Login via Email** | Enter registered email + correct password | Authenticates successfully and redirects to `dashboard.html`. |
| **5** | **Case-Insensitive Login** | Enter username in uppercase (e.g. `ALEX_RIVERA`) | Successfully matches and authenticates. |
| **6** | **Protected Route Guard** | Clear session or open `dashboard.html` directly in private window | Immediately redirects to `index.html` without showing protected data. |
| **7** | **Protected Data Rendering** | Inspect dashboard after login | Displays authenticated username and email safely using `textContent`. Active session indicator pulses green. |
| **8** | **Sign Out** | Click "Sign Out" in dashboard | Session is removed from `sessionStorage` and user is redirected to `index.html`. Back button cannot reopen dashboard. |
| **9** | **Registration Preservation** | Open `register.html` and register a new account | Part 1 registration validation, Web Crypto SHA-256 hashing, and redirect to `index.html` work without issue. |

---

## 5. Roadmap: Part 3
- Final end-to-end integration polish, visual animation refinements, session expiry timers, audit logging, and final packaging.
