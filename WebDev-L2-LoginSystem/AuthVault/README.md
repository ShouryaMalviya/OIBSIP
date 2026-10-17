# AuthVault — Secure Authentication System
## Client-Side Authentication, Cryptographic Hashing & Protected Session Architecture

AuthVault is a responsive, modern client-side authentication demonstration system built exclusively with vanilla web technologies and styled with an authentic dark maroon and burgundy aesthetic.

> **Project Phase:** Part 3 (Final Release)  
> **Internship Assignment:** Oasis Infobyte Web Development (Level 2: Login Authentication System)  
> **Tech Stack:** HTML5, CSS3 (Vanilla Design System), JavaScript (ES6+ Vanilla), Browser `localStorage`, `sessionStorage`, and the native Web Crypto API (`crypto.subtle`).  
> **Frameworks / External Libraries:** None (Zero React, Zero TypeScript, Zero Tailwind, Zero Bootstrap).

---

## 1. Project Directory Structure

```
AuthVault/
├── index.html          # Authentication portal (Sign In page)
├── register.html       # Account creation portal (Registration page)
├── dashboard.html      # Protected user dashboard (Session-guarded layout)
├── css/
│   └── style.css       # Unified design system, CSS tokens, animations & responsive media queries
├── js/
│   ├── auth.js         # Core authentication engine: Web Crypto hashing, validation & login/register controllers
│   └── dashboard.js    # Protected dashboard session verification & secure sign-out controller
└── README.md           # Complete technical documentation, local setup & security disclosures
```

---

## 2. Main Features

- **Bespoke Maroon & Burgundy Design System:**
  - Standardized custom CSS properties (`--bg-primary: #10090D`, `--bg-secondary: #240A14`, `--maroon-primary: #800F2F`, `--crimson: #C9184A`, etc.).
  - Atmospheric multi-layered radial gradients with subtle background pulses.
  - Translucent glassmorphism cards with `backdrop-filter: blur(20px)` and subtle burgundy borders.
  - Interactive password visibility toggles with SVG eye/eye-off indicators and accessible labeling.
  - High-contrast inputs with glowing focus rings (`:focus-visible`).
  - Accessibility support with `@media (prefers-reduced-motion: reduce)`.
  - Zero horizontal overflow and fully responsive layout across mobile, tablet, and desktop viewports.

- **Client-Side Registration Engine (`register.html` & `js/auth.js`):**
  - Real-time password criteria checklist (at least 8 characters and at least 1 numeric digit).
  - Client-side RFC-compliant email syntax validation.
  - Confirmation password equality checking.
  - Case-insensitive duplicate prevention for both usernames and email addresses.
  - Password hashing via the native browser **Web Crypto API** using **SHA-256**.
  - **Zero Plaintext Storage:** Plaintext passwords are never stored in disk, URLs, or browser logs.
  - User records persisted in `localStorage` under `authVaultUsers` with ISO timestamps.

- **Unified Login Engine (`index.html` & `js/auth.js`):**
  - Flexible login supporting either **username** or **email address**.
  - Case-insensitive credential resolution.
  - SHA-256 password hashing and digest comparison.
  - **Anti-Enumeration Protection:** If credentials fail or the user does not exist, displays the identical generic error: `"Invalid username/email or password."` without revealing which credential failed.
  - Prevention of double-submission via loading spinner state and button locking.
  - Automatic redirection to `dashboard.html` if an authenticated session already exists.

- **Session Management & Route Guards (`dashboard.html` & `js/dashboard.js`):**
  - Session established in `sessionStorage` under `authVaultSession`.
  - **Zero Credentials in Session:** Session payload contains only `{ username, email, loggedInAt }` (no passwords or hashes).
  - Session isolation: automatically purged when browser tab or window is closed.
  - **FOUC Prevention:** The dashboard markup is hidden by default (`display: none;`) and is only rendered after `js/dashboard.js` validates the session payload.
  - Unauthenticated access redirects immediately to `index.html` via `window.location.replace`.
  - **XSS Immunity:** All dynamic user values are injected strictly through `element.textContent` (no `innerHTML` on untrusted inputs).

- **Secure Sign-Out Flow:**
  - Clicking "Sign Out" removes `authVaultSession` from `sessionStorage` and redirects to `index.html`.
  - Back/forward navigation cache protection (`pageshow` event with `event.persisted`) prevents reopening the dashboard using the browser Back button after sign-out.

---

## 3. How to Run the Project Locally

Because the Web Crypto API (`window.crypto.subtle`) and browser storage APIs operate securely in origin-isolated environments, **run the project through a local static HTTP server rather than opening files directly using `file://`**.

### Recommended Method: Visual Studio Code & Live Server

1. **Open Visual Studio Code**:
   - Launch VS Code on your computer.
2. **Open the Project Folder**:
   - Click **File > Open Folder...** and select the `AuthVault` folder (or the root workspace containing `AuthVault`).
3. **Install the Live Server Extension** *(if not already installed)*:
   - Press `Ctrl + Shift + X` (or click the Extensions tab).
   - Search for **Live Server** (by *Ritwick Dey*) and click **Install**.
4. **Start the Local Server**:
   - Right-click `index.html` inside the `AuthVault/` folder in the Explorer panel.
   - Click **"Open with Live Server"** (or press `Alt + L, Alt + O`).
   - Your default browser will automatically open `http://127.0.0.1:5500/AuthVault/index.html` (or `http://localhost:5500/index.html`).
5. **Execute the Authentication Workflow**:
   - Click **"Create an account"** (navigates to `register.html`).
   - Fill in your username, email, and password (e.g., `alex_rivera`, `alex@example.com`, `VaultPass2026!`).
   - Click **"Create Account"**. Note the success alert and automatic redirect back to `index.html`.
   - Log in using your registered username or email with your password.
   - Explore your authenticated session details on `dashboard.html`.
   - Click **"Sign Out"** and attempt to navigate back using the browser Back button to confirm route protection.

### Alternative Method: Python Built-in Static Server

If you prefer using the terminal or command line:
1. Open PowerShell or Terminal in the project root directory.
2. Run:
   ```bash
   python -m http.server 8080
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:8080/AuthVault/index.html
   ```

### Alternative Method: Node.js (npx serve)

1. Open terminal in the project directory.
2. Run:
   ```bash
   npx serve .
   ```
3. Open the displayed local URL in your browser.

---

## 4. Storage Architecture & Schemas

### 1. Registered Accounts (`localStorage: authVaultUsers`)
- **Storage Type:** Persistent across sessions.
- **Key:** `authVaultUsers`
- **Schema:**
  ```json
  [
    {
      "id": "usr_k8f9a2b",
      "username": "alex_rivera",
      "email": "alex@example.com",
      "passwordHash": "856a6f6a04a4c3ec3d7904099d0c64eb28cf3b1c67a73a3885da01026065538e",
      "createdAt": "2026-10-18T00:25:30.120Z"
    }
  ]
  ```

### 2. Active Session (`sessionStorage: authVaultSession`)
- **Storage Type:** Isolated to current browser tab/window; cleared upon tab close or logout.
- **Key:** `authVaultSession`
- **Schema:**
  ```json
  {
    "username": "alex_rivera",
    "email": "alex@example.com",
    "loggedInAt": "2026-10-18T00:30:00.000Z"
  }
  ```

---

## 5. Functional Testing & Verification Matrix

The project implementation was evaluated and passed all 24 required functional test scenarios:

### Registration Verification
| # | Test Scenario | Input Data | Expected Result | Verified |
|---|---|---|---|---|
| **1** | Empty submission | All fields blank | Blocked. Required field error alerts shown. | **Passed** |
| **2** | Invalid email format | `user@invalid` | Blocked. Alert: "Please enter a valid email address". | **Passed** |
| **3** | Short password | `Pass1` (< 8 chars) | Blocked. Alert: "Password must be at least 8 characters." | **Passed** |
| **4** | Password without number | `PasswordOnly` | Blocked. Alert: "Password must contain at least one numeric digit." | **Passed** |
| **5** | Mismatched confirmation | `Secret123` vs `Secret456` | Blocked. Alert: "Passwords do not match. Please re-enter." | **Passed** |
| **6** | Valid registration | Valid credentials | Computes SHA-256, saves to `authVaultUsers`, redirects to `index.html`. | **Passed** |
| **7** | Duplicate username | Existing username | Blocked. Alert: "This username is already taken." | **Passed** |
| **8** | Duplicate email (case variation) | Uppercase version of existing email | Blocked. Case-insensitive match rejects duplicate email. | **Passed** |
| **9** | Plaintext verification | Inspect `localStorage` | Zero plaintext passwords found anywhere in storage. | **Passed** |
| **10**| Stored hash verification | Inspect `authVaultUsers` | Records contain 64-character hexadecimal SHA-256 hash. | **Passed** |

### Login Verification
| # | Test Scenario | Input Data | Expected Result | Verified |
|---|---|---|---|---|
| **11**| Empty credentials | Empty identifier or password | Blocked. Alert: "Please enter both your username/email and password." | **Passed** |
| **12**| Nonexistent user | Unregistered username | Blocked with generic alert: "Invalid username/email or password." | **Passed** |
| **13**| Incorrect password | Valid user, wrong password | Blocked with exact same generic alert (anti-enumeration). | **Passed** |
| **14**| Login via username | Valid username + password | Generates session in `sessionStorage`, redirects to `dashboard.html`. | **Passed** |
| **15**| Login via email | Valid email + password | Authenticates and redirects to `dashboard.html`. | **Passed** |
| **16**| Generic error consistency | Compare Scenario 12 & 13 | Identical error string prevents credential enumeration. | **Passed** |
| **17**| Session creation | Inspect `sessionStorage` | Key `authVaultSession` created with username, email, and timestamp. | **Passed** |

### Dashboard & Session Guard Verification
| # | Test Scenario | Steps | Expected Result | Verified |
|---|---|---|---|---|
| **18**| Unauthenticated access | Open `dashboard.html` without session | Gated content remains hidden; immediately redirects to `index.html`. | **Passed** |
| **19**| Redirection enforcement | Direct URL visit in new tab | Redirects to `index.html` without flash of unauthenticated content. | **Passed** |
| **20**| Authenticated display | Log in and view dashboard | Dashboard container revealed; active session pill pulses green. | **Passed** |
| **21**| Dynamic data rendering | Inspect username and email | Authenticated user credentials inserted safely via `textContent`. | **Passed** |
| **22**| Sign out execution | Click "Sign Out" button | Session cleared from `sessionStorage`; redirected to `index.html`. | **Passed** |
| **23**| Reopening after logout | Click browser Back button | Back/forward cache guard detects cleared session; redirects to `index.html`. | **Passed** |
| **24**| Session clearance confirmation| Inspect `sessionStorage` | Key `authVaultSession` confirmed completely removed. | **Passed** |

---

## 6. Security Disclosures & Current Limitations

> [!IMPORTANT]
> **Educational Demonstration Notice:**  
> This project was developed as a frontend engineering and cryptography demonstration for internship evaluation. It does not provide production-grade authentication.
>
> 1. **Client-Side Hashing Limitations:**
>    - **SHA-256** is a cryptographic digest algorithm designed for high throughput and general-purpose integrity verification. Because it is computationally fast, SHA-256 without memory-hardness or salts is susceptible to high-speed offline dictionary attacks on modern GPUs and ASICs.
>    - Production systems must perform password hashing on a secure **backend server** using slow, salted, memory-hard key derivation functions specifically engineered for passwords, such as **Argon2id**, **scrypt**, or **bcrypt**.
>
> 2. **Client-Side Storage Authorization Boundary:**
>    - Browser storage (`localStorage` and `sessionStorage`) is under complete control of the client and can be viewed or manipulated through browser developer tools.
>    - The client-side session guard in `dashboard.js` demonstrates application navigation flow and UI state management, but **cannot act as a secure authorization boundary** against deliberate client-side tampering.
>    - Production web applications must enforce authentication and authorization server-side using secure, signed, `HttpOnly`, `SameSite=Strict`, TLS-encrypted cookies or JWTs validated on every restricted API call.
>
> 3. **XSS & DOM Security:**
>    - Untrusted user input is rendered exclusively using `element.textContent`, preventing DOM-based cross-site scripting (XSS).
>    - The application avoids `eval()`, inline event handlers, and `javascript:` URIs.
