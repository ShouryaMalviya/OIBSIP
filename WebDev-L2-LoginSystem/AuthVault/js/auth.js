/**
 * AuthVault — Secure Authentication System
 * Part 1: Registration Core, Web Crypto SHA-256 Hashing, & Design System Controllers
 * 
 * Architectural Highlights:
 * - Namespace/Module Pattern for separation of concerns
 * - Web Crypto API (SubtleCrypto) for client-side SHA-256 password hashing
 * - LocalStorage persistence with structured error handling
 * - Case-insensitive uniqueness verification for username & email
 * - Zero innerHTML on untrusted content (strictly textContent for XSS immunity)
 * - Accessible UI state management with aria-live polite alerts
 */

'use strict';

/* ==========================================================================
   1. Configuration & Constants
   ========================================================================== */
const AUTH_CONFIG = Object.freeze({
  STORAGE_KEY: 'authVaultUsers',
  MIN_PASSWORD_LENGTH: 8,
  REDIRECT_DELAY_MS: 1800,
  REGEX: {
    // Client-side email format verification
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
    // Username: 3 to 24 characters, alphanumeric and underscore/hyphen
    USERNAME: /^[a-zA-Z0-9_-]{3,24}$/,
    // At least one numeric digit
    HAS_NUMBER: /\d/
  }
});

/* ==========================================================================
   2. Cryptographic Utilities (Web Crypto API)
   ========================================================================== */
const CryptoUtils = {
  /**
   * Hashes a plaintext password using SHA-256 via the Web Crypto API.
   * Educational note: SHA-256 provides a fast cryptographic digest for client-side
   * demonstration. In production, salted algorithms with adaptable work factors
   * (e.g. Argon2id, bcrypt, PBKDF2) on a secure backend should be used.
   * 
   * @param {string} plaintext - The plaintext password to hash.
   * @returns {Promise<string>} Hex-encoded SHA-256 hash string.
   */
  async hashPassword(plaintext) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error('Web Crypto API is not supported in this browser or context.');
    }

    if (typeof plaintext !== 'string' || plaintext.length === 0) {
      throw new Error('Cannot hash an empty or invalid password string.');
    }

    try {
      // Encode password string to UTF-8 byte buffer
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);

      // Compute SHA-256 hash
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);

      // Convert ArrayBuffer to Hexadecimal representation
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hexHash = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

      return hexHash;
    } catch (err) {
      console.error('AuthVault CryptoUtils: Hashing failed', err);
      throw new Error('Cryptographic digest calculation failed. Please try again.');
    }
  }
};

/* ==========================================================================
   3. Storage Management Layer
   ========================================================================== */
const AuthStorage = {
  /**
   * Safely retrieves all registered users from localStorage.
   * @returns {Array<Object>} List of registered user objects.
   */
  getUsers() {
    try {
      const raw = localStorage.getItem(AUTH_CONFIG.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('AuthVault AuthStorage: Failed to parse stored users:', err);
      return [];
    }
  },

  /**
   * Saves the updated users array to localStorage.
   * Handles QuotaExceededError or security restrictions gracefully.
   * @param {Array<Object>} users - The users array to persist.
   * @returns {boolean} True if saved successfully, throws otherwise.
   */
  saveUsers(users) {
    try {
      localStorage.setItem(AUTH_CONFIG.STORAGE_KEY, JSON.stringify(users));
      return true;
    } catch (err) {
      console.error('AuthVault AuthStorage: Write failure:', err);
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        throw new Error('Storage quota exceeded. Please clear browsing data and try again.');
      }
      throw new Error('Unable to write to local storage. Cookies or storage might be disabled.');
    }
  },

  /**
   * Checks for duplicate username (case-insensitive).
   * @param {string} username 
   * @returns {boolean}
   */
  isUsernameTaken(username) {
    const normalized = username.trim().toLowerCase();
    const users = this.getUsers();
    return users.some(u => (u.username || '').toLowerCase() === normalized);
  },

  /**
   * Checks for duplicate email address (case-insensitive).
   * @param {string} email 
   * @returns {boolean}
   */
  isEmailTaken(email) {
    const normalized = email.trim().toLowerCase();
    const users = this.getUsers();
    return users.some(u => (u.email || '').toLowerCase() === normalized);
  },

  /**
   * Registers a new user with hashed password and metadata.
   * @param {Object} userData - { username, email, passwordHash }
   * @returns {Object} Created user record
   */
  createUser({ username, email, passwordHash }) {
    const users = this.getUsers();

    const newUser = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: passwordHash,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }
};

/* ==========================================================================
   4. Validation Logic
   ========================================================================== */
const AuthValidator = {
  /**
   * Validates a username.
   * @param {string} username 
   * @returns {{ isValid: boolean, error?: string }}
   */
  validateUsername(username) {
    const val = (username || '').trim();
    if (!val) {
      return { isValid: false, error: 'Username is required.' };
    }
    if (val.length < 3) {
      return { isValid: false, error: 'Username must be at least 3 characters long.' };
    }
    if (val.length > 24) {
      return { isValid: false, error: 'Username cannot exceed 24 characters.' };
    }
    if (!AUTH_CONFIG.REGEX.USERNAME.test(val)) {
      return { isValid: false, error: 'Username may only contain letters, numbers, hyphens, and underscores.' };
    }
    return { isValid: true };
  },

  /**
   * Validates an email address.
   * @param {string} email 
   * @returns {{ isValid: boolean, error?: string }}
   */
  validateEmail(email) {
    const val = (email || '').trim();
    if (!val) {
      return { isValid: false, error: 'Email address is required.' };
    }
    if (!AUTH_CONFIG.REGEX.EMAIL.test(val)) {
      return { isValid: false, error: 'Please enter a valid email address (e.g., name@example.com).' };
    }
    return { isValid: true };
  },

  /**
   * Validates password strength:
   * Requires at least 8 characters and at least one number.
   * @param {string} password 
   * @returns {{ isValid: boolean, hasLength: boolean, hasNumber: boolean, error?: string }}
   */
  validatePassword(password) {
    const val = password || '';
    const hasLength = val.length >= AUTH_CONFIG.MIN_PASSWORD_LENGTH;
    const hasNumber = AUTH_CONFIG.REGEX.HAS_NUMBER.test(val);

    if (!val) {
      return { isValid: false, hasLength: false, hasNumber: false, error: 'Password is required.' };
    }
    if (!hasLength) {
      return { isValid: false, hasLength: false, hasNumber, error: `Password must be at least ${AUTH_CONFIG.MIN_PASSWORD_LENGTH} characters.` };
    }
    if (!hasNumber) {
      return { isValid: false, hasLength: true, hasNumber: false, error: 'Password must contain at least one numeric digit (0-9).' };
    }

    return { isValid: true, hasLength: true, hasNumber: true };
  },

  /**
   * Validates confirmation match.
   * @param {string} password 
   * @param {string} confirmPassword 
   * @returns {{ isValid: boolean, error?: string }}
   */
  validateConfirmPassword(password, confirmPassword) {
    if (!confirmPassword) {
      return { isValid: false, error: 'Please confirm your password.' };
    }
    if (password !== confirmPassword) {
      return { isValid: false, error: 'Passwords do not match. Please re-enter.' };
    }
    return { isValid: true };
  }
};

/* ==========================================================================
   5. UI State & Accessible Feedback Utilities
   ========================================================================== */
const AlertUI = {
  /**
   * Displays an accessible alert box using textContent (preventing XSS).
   * @param {HTMLElement} alertEl - The alert container element.
   * @param {string} message - The text message to display.
   * @param {'error'|'success'|'info'} type - The alert variation.
   */
  show(alertEl, message, type = 'error') {
    if (!alertEl) return;
    const messageEl = alertEl.querySelector('.alert-message');
    if (messageEl) {
      messageEl.textContent = message; // Safe text insertion
    }

    // Reset styles
    alertEl.classList.remove('alert-error', 'alert-success', 'alert-info');
    alertEl.classList.add(`alert-${type}`, 'visible');
  },

  /**
   * Hides the alert box.
   * @param {HTMLElement} alertEl 
   */
  hide(alertEl) {
    if (!alertEl) return;
    alertEl.classList.remove('visible', 'alert-error', 'alert-success', 'alert-info');
    const messageEl = alertEl.querySelector('.alert-message');
    if (messageEl) {
      messageEl.textContent = '';
    }
  },

  /**
   * Sets field-specific validation message and error state.
   * @param {HTMLInputElement} inputEl 
   * @param {HTMLElement} errorEl 
   * @param {string|null} errorMessage 
   */
  setFieldError(inputEl, errorEl, errorMessage) {
    if (!inputEl) return;
    if (errorMessage) {
      inputEl.classList.add('is-invalid');
      inputEl.classList.remove('is-valid');
      if (errorEl) {
        errorEl.textContent = errorMessage;
        errorEl.classList.add('visible');
      }
    } else {
      inputEl.classList.remove('is-invalid');
      inputEl.classList.add('is-valid');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
      }
    }
  },

  /**
   * Clears field-specific validation styles.
   * @param {HTMLInputElement} inputEl 
   * @param {HTMLElement} errorEl 
   */
  clearFieldError(inputEl, errorEl) {
    if (inputEl) {
      inputEl.classList.remove('is-invalid', 'is-valid');
    }
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }
};

/* ==========================================================================
   6. Password Visibility Toggle Utility
   ========================================================================== */
function setupPasswordToggle(buttonId, inputId) {
  const toggleBtn = document.getElementById(buttonId);
  const inputEl = document.getElementById(inputId);

  if (!toggleBtn || !inputEl) return;

  const eyeIcon = toggleBtn.querySelector('.icon-eye');
  const eyeOffIcon = toggleBtn.querySelector('.icon-eye-off');

  toggleBtn.addEventListener('click', () => {
    const isPassword = inputEl.type === 'password';
    inputEl.type = isPassword ? 'text' : 'password';

    // Toggle icons
    if (eyeIcon && eyeOffIcon) {
      eyeIcon.style.display = isPassword ? 'none' : 'block';
      eyeOffIcon.style.display = isPassword ? 'block' : 'none';
    }

    // Accessible labeling
    const label = isPassword ? 'Hide password' : 'Show password';
    toggleBtn.setAttribute('aria-label', label);
    toggleBtn.setAttribute('title', label);
    inputEl.focus();
  });
}

/* ==========================================================================
   7. Registration Page Controller (Part 1 Core Flow)
   ========================================================================== */
function initRegistrationPage() {
  const form = document.getElementById('registerForm');
  if (!form) return; // Not on register page

  // DOM Elements
  const alertEl = document.getElementById('authAlert');
  const submitBtn = document.getElementById('registerSubmitBtn');

  const usernameInput = document.getElementById('username');
  const usernameError = document.getElementById('usernameError');

  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('emailError');

  const passwordInput = document.getElementById('password');
  const passwordError = document.getElementById('passwordError');

  const confirmPasswordInput = document.getElementById('confirmPassword');
  const confirmPasswordError = document.getElementById('confirmPasswordError');

  // Criteria checklist elements
  const critLength = document.getElementById('critLength');
  const critNumber = document.getElementById('critNumber');

  // Setup password show/hide controls
  setupPasswordToggle('togglePasswordBtn', 'password');
  setupPasswordToggle('toggleConfirmPasswordBtn', 'confirmPassword');

  // Real-time password criteria updates on typing
  passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;
    const { hasLength, hasNumber } = AuthValidator.validatePassword(val);

    if (critLength) {
      critLength.classList.toggle('met', hasLength);
    }
    if (critNumber) {
      critNumber.classList.toggle('met', hasNumber);
    }

    if (passwordInput.classList.contains('is-invalid')) {
      AlertUI.clearFieldError(passwordInput, passwordError);
    }
  });

  // Clear errors upon typing
  usernameInput.addEventListener('input', () => {
    if (usernameInput.classList.contains('is-invalid')) {
      AlertUI.clearFieldError(usernameInput, usernameError);
    }
  });

  emailInput.addEventListener('input', () => {
    if (emailInput.classList.contains('is-invalid')) {
      AlertUI.clearFieldError(emailInput, emailError);
    }
  });

  confirmPasswordInput.addEventListener('input', () => {
    if (confirmPasswordInput.classList.contains('is-invalid')) {
      AlertUI.clearFieldError(confirmPasswordInput, confirmPasswordError);
    }
  });

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    // 12. Never store passwords or password hashes in the URL
    e.preventDefault();

    AlertUI.hide(alertEl);

    const rawUsername = usernameInput.value;
    const rawEmail = emailInput.value;
    const rawPassword = passwordInput.value;
    const rawConfirmPassword = confirmPasswordInput.value;

    let hasErrors = false;

    // 1. Prevent empty form submissions & Validate Username
    const usernameValidation = AuthValidator.validateUsername(rawUsername);
    if (!usernameValidation.isValid) {
      AlertUI.setFieldError(usernameInput, usernameError, usernameValidation.error);
      hasErrors = true;
    } else {
      // 6. Case-insensitive duplicate check for username
      if (AuthStorage.isUsernameTaken(rawUsername)) {
        AlertUI.setFieldError(usernameInput, usernameError, 'This username is already taken. Please choose another.');
        hasErrors = true;
      } else {
        AlertUI.setFieldError(usernameInput, usernameError, null);
      }
    }

    // 2 & 3. Validate Email format & duplicates
    const emailValidation = AuthValidator.validateEmail(rawEmail);
    if (!emailValidation.isValid) {
      AlertUI.setFieldError(emailInput, emailError, emailValidation.error);
      hasErrors = true;
    } else {
      // 6. Case-insensitive duplicate check for email
      if (AuthStorage.isEmailTaken(rawEmail)) {
        AlertUI.setFieldError(emailInput, emailError, 'An account with this email address already exists.');
        hasErrors = true;
      } else {
        AlertUI.setFieldError(emailInput, emailError, null);
      }
    }

    // 4. Validate Password requirements (>= 8 chars & at least 1 number)
    const passwordValidation = AuthValidator.validatePassword(rawPassword);
    if (!passwordValidation.isValid) {
      AlertUI.setFieldError(passwordInput, passwordError, passwordValidation.error);
      hasErrors = true;
    } else {
      AlertUI.setFieldError(passwordInput, passwordError, null);
    }

    // 5. Validate Password confirmation match
    const confirmValidation = AuthValidator.validateConfirmPassword(rawPassword, rawConfirmPassword);
    if (!confirmValidation.isValid) {
      AlertUI.setFieldError(confirmPasswordInput, confirmPasswordError, confirmValidation.error);
      hasErrors = true;
    } else {
      AlertUI.setFieldError(confirmPasswordInput, confirmPasswordError, null);
    }

    if (hasErrors) {
      AlertUI.show(alertEl, 'Please correct the highlighted errors before submitting.', 'error');
      return;
    }

    // Set loading button state
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    try {
      // 9. Hash password using Web Crypto API SHA-256 (Never store plaintext)
      const passwordHash = await CryptoUtils.hashPassword(rawPassword);

      // 10 & 11. Store username, email, passwordHash, and createdAt timestamp in localStorage under 'authVaultUsers'
      AuthStorage.createUser({
        username: rawUsername,
        email: rawEmail,
        passwordHash: passwordHash
      });

      // 13. Display success message & redirect to index.html after short delay
      AlertUI.show(
        alertEl, 
        'Account created successfully! Your password was hashed with SHA-256. Redirecting to login...', 
        'success'
      );

      // Reset form fields
      form.reset();
      if (critLength) critLength.classList.remove('met');
      if (critNumber) critNumber.classList.remove('met');
      AlertUI.clearFieldError(usernameInput, usernameError);
      AlertUI.clearFieldError(emailInput, emailError);
      AlertUI.clearFieldError(passwordInput, passwordError);
      AlertUI.clearFieldError(confirmPasswordInput, confirmPasswordError);

      setTimeout(() => {
        window.location.href = 'index.html';
      }, AUTH_CONFIG.REDIRECT_DELAY_MS);

    } catch (err) {
      // 14. Handle storage errors and hashing failures gracefully
      console.error('AuthVault Registration Error:', err);
      AlertUI.show(alertEl, err.message || 'An unexpected error occurred during registration.', 'error');
      submitBtn.classList.remove('is-loading');
      submitBtn.disabled = false;
    }
  });
}

/* ==========================================================================
   8. Login Page Controller (Prepared & Structured for Part 2)
   ========================================================================== */
function initLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return; // Not on login page

  const alertEl = document.getElementById('authAlert');
  const identifierInput = document.getElementById('loginIdentifier');
  const passwordInput = document.getElementById('loginPassword');
  const submitBtn = document.getElementById('loginSubmitBtn');

  // Setup password visibility toggle
  setupPasswordToggle('toggleLoginPasswordBtn', 'loginPassword');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    AlertUI.hide(alertEl);

    const identifier = (identifierInput ? identifierInput.value : '').trim();
    const password = (passwordInput ? passwordInput.value : '');

    if (!identifier || !password) {
      AlertUI.show(alertEl, 'Please enter both your identifier (username or email) and password.', 'error');
      return;
    }

    // In Part 1, we show a helpful notification informing the user that Part 1 registration is complete
    // and Part 2 will connect the login verification and dashboard authentication flow.
    // However, we can also check if the user exists to demonstrate the stored hash matching architecture!
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    try {
      const passwordHash = await CryptoUtils.hashPassword(password);
      const users = AuthStorage.getUsers();
      const normalizedId = identifier.toLowerCase();

      const matchedUser = users.find(u => 
        (u.username.toLowerCase() === normalizedId || u.email.toLowerCase() === normalizedId) &&
        u.passwordHash === passwordHash
      );

      setTimeout(() => {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;

        if (matchedUser) {
          AlertUI.show(
            alertEl, 
            `Credentials verified! Welcome, ${matchedUser.username}. (Part 2 will activate full session persistence and route authentication).`, 
            'success'
          );
        } else {
          AlertUI.show(alertEl, 'Invalid username/email or password. Please verify your credentials or register a new account.', 'error');
        }
      }, 600);

    } catch (err) {
      submitBtn.classList.remove('is-loading');
      submitBtn.disabled = false;
      AlertUI.show(alertEl, err.message || 'An error occurred during authentication check.', 'error');
    }
  });
}

/* ==========================================================================
   9. Application Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initRegistrationPage();
  initLoginPage();
});

// Expose modules to window for modular testing and Part 2 & 3 consumption
window.AuthVault = {
  CryptoUtils,
  AuthStorage,
  AuthValidator,
  AlertUI,
  CONFIG: AUTH_CONFIG
};
