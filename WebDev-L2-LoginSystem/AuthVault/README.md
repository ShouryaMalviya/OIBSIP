# AuthVault — Secure Authentication System
## Part 1: Project Architecture, Registration Engine & Cryptographic Hashing

AuthVault is a modern, responsive client-side authentication system built with vanilla web technologies and designed with a bespoke maroon and burgundy aesthetic.

> **Project Phase:** Part 1 of 3  
> **Tech Stack:** HTML5, CSS3 (Vanilla Design System), JavaScript (ES6+ Vanilla), Browser `localStorage`, and native Web Crypto API (`crypto.subtle`).  
> **No External Frameworks:** Pure vanilla implementation without React, TypeScript, Tailwind, Bootstrap, or build dependencies.

---

## 1. Project Directory Structure

```
AuthVault/
├── index.html          # Login portal page & entry point
├── register.html       # Account creation & client-side registration engine
├── dashboard.html      # Protected user dashboard foundation (wired in Part 2)
├── css/
│   └── style.css       # Unified design system, CSS variables & animations
├── js/
│   ├── auth.js         # Cryptographic hashing, validation & registration controller
│   └── dashboard.js    # Dashboard inspection & metric loading foundation
└── README.md           # Architecture, testing checklist & security documentation
```

---

## 2. Design System & Palette

AuthVault implements a bespoke dark maroon and burgundy visual identity featuring subtle ambient gradients, restrained glassmorphism, and responsive form components.

### CSS Custom Properties (`css/style.css`):
```css
:root {
  --bg-primary: #10090D;
  --bg-secondary: #240A14;
  --maroon-dark: #4A0E24;
  --maroon-primary: #800F2F;
  --maroon-hover: #A4133C;
  --crimson: #C9184A;
  --accent-pink: #FF4D6D;
  --blush: #FFB3C1;
  --text-primary: #FFF0F3;
  --text-secondary: #C9A0AA;
}
```

### Visual Highlights:
- **Atmospheric Depth:** Multi-layered radial gradients combined with animated ambient background orbs.
- **Glassmorphism:** Restrained translucent cards with `backdrop-filter: blur(20px)` and subtle burgundy borders.
- **Accessible Form Controls:** High-contrast labels, clear `:focus-visible` rings, and inline SVG input icons.
- **Interactive Micro-Animations:** Gradient buttons with hover elevations, smooth password visibility transitions, and real-time password criteria indicators.

---

## 3. Cryptographic Implementation (Web Crypto API)

AuthVault uses the browser's native **Web Crypto API** (`window.crypto.subtle.digest`) to hash passwords client-side using **SHA-256** before persisting records to `localStorage`.

### Hashing Workflow (`js/auth.js`):
1. **UTF-8 Encoding:** The plaintext password is converted into a `Uint8Array` buffer via `TextEncoder`.
2. **Digest Generation:** `crypto.subtle.digest('SHA-256', data)` produces an `ArrayBuffer` digest.
3. **Hex Representation:** The buffer is converted to a 64-character hexadecimal string.
4. **Zero Plaintext Persistence:** Plaintext passwords are never saved to disk, logged, or serialized.

```javascript
async function hashPassword(plaintext) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}
```

---

## 4. LocalStorage Schema

User records are stored under the standardized key **`authVaultUsers`**.

```json
[
  {
    "id": "usr_k8f9a2b",
    "username": "alex_rivera",
    "email": "alex@example.com",
    "passwordHash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
    "createdAt": "2026-10-18T00:15:30.120Z"
  }
]
```

### Uniqueness Enforcement:
- **Username:** Case-insensitive match check (`existing.username.toLowerCase() === input.toLowerCase()`).
- **Email:** Case-insensitive match check (`existing.email.toLowerCase() === input.toLowerCase()`).

---

## 5. Security Architecture & Educational Disclosure

> **Educational Project Scope:**  
> This project is designed for demonstration and educational purposes.  
> 
> - **Client-Side Hashing Limitations:** While SHA-256 prevents plaintext storage in `localStorage`, SHA-256 is a general-purpose cryptographic hash function that is extremely fast on GPUs and ASICs. In a production environment, password authentication must occur server-side using slow, memory-hard, salted algorithms such as **Argon2id**, **bcrypt**, or **PBKDF2**.
> - **Client-Side Storage:** Browser `localStorage` is accessible to scripts executing in the same origin. Production systems rely on secure, HttpOnly, SameSite cookies and transport layer security (TLS/HTTPS).
> - **XSS Prevention:** All dynamic messages and validation errors are rendered strictly via `element.textContent`, preventing DOM-based cross-site scripting (XSS). `eval()` is strictly prohibited.
> - **URL Safety:** Form submission defaults are intercepted with `event.preventDefault()`, ensuring passwords and hashes never leak into browser history or URL query parameters.

---

## 6. Verification and Testing Checklist

To test Part 1 functionality, open `register.html` in any modern web browser:

| # | Test Scenario | Input Data | Expected Outcome |
|---|---|---|---|
| **1** | **Empty Form Submission** | Click "Create Account" with blank inputs | Submission is blocked. Error messages indicate required fields. |
| **2** | **Invalid Email Format** | Username: `testuser`<br>Email: `invalid-email`<br>Password: `Pass1234` | Submission is blocked. Email field highlights with error: "Please enter a valid email address". |
| **3** | **Short Password** | Password: `Pass1` (< 8 characters) | Checklist indicator highlights incomplete length. Error: "Password must be at least 8 characters." |
| **4** | **Password Without Number** | Password: `PasswordOnly` | Checklist indicates missing digit. Error: "Password must contain at least one numeric digit (0-9)." |
| **5** | **Mismatched Confirmation** | Password: `SecurePass1`<br>Confirm: `SecurePass2` | Error: "Passwords do not match. Please re-enter." |
| **6** | **Duplicate Account (Case-Insensitive)** | Register `AlexRivera`<br>Then attempt `alexrivera` or same email | Registration rejected with "This username is already taken" or duplicate email notice. |
| **7** | **Successful Registration** | Username: `alex_rivera`<br>Email: `alex@example.com`<br>Password: `VaultSecret1` | Real-time criteria met. Loading spinner activates. SHA-256 hash generated and stored in `localStorage['authVaultUsers']`. Success alert displays, then redirects to `index.html`. |
| **8** | **Show/Hide Password Controls** | Click eye toggle on password fields | Toggles input type between `password` and `text`, updating accessible `aria-label` and SVG icon. |

---

## 7. Roadmap: Parts 2 & 3

- **Part 2:**
  - Login authentication engine in `js/auth.js` with SHA-256 hash comparison.
  - Session token generation and active user state in `localStorage` (`authVaultSession`).
  - Route guards on `dashboard.html` (redirect unauthorized visitors to `index.html`).
  - Active profile display and secure sign-out functionality in `js/dashboard.js`.
- **Part 3:**
  - Advanced security metrics, password strength visual meter, session expiry timer, account management, and vault data export/wipe.
