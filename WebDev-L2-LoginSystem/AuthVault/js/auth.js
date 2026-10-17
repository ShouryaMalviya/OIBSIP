/**
 * AuthVault — Secure Authentication System
 * Part 2: Unified Authentication Engine, Session Management & Login Validation
 * 
 * Architectural Highlights:
 * - Reusable Module Pattern: CryptoUtils, AuthStorage, SessionManager, AuthValidator, AlertUI
 * - Native Web Crypto API (SubtleCrypto) for SHA-256 password hashing
 * - LocalStorage user persistence ('authVaultUsers') with zero plaintext storage
 * - SessionStorage active login state ('authVaultSession') with minimum required metadata
 * - Case-insensitive credential lookup (supports username or email)
 * - Uniform generic error messages to eliminate user enumeration risks
 * - Prevention of duplicate submissions via loading state locking
 * - Strict textContent insertion for complete XSS immunity
 * - Seamless integration with Part 1 registration and Part 2 protected dashboard
 */

'use strict';

/* ==========================================================================
   1. Configuration & Constants
   ========================================================================== */
const AUTH_CONFIG = Object.freeze({
  STORAGE_KEY: 'authVaultUsers',
  SESSION_KEY: 'authVaultSession',
  MIN_PASSWORD_LENGTH: 8,
  REDIRECT_DELAY_MS: 1600,
  AUTH_PROCESSING_DELAY_MS: 500, // Provides realistic micro-animation feedback
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
   3. Storage Management Layer (localStorage: authVaultUsers)
   ========================================================================== */
const AuthStorage = {
  /**
   * Safely retrieves all registered users from localStorage.
   * Handles corrupted or non-array records gracefully.
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
    const normalized = (username || '').trim().toLowerCase();
    const users = this.getUsers();
    return users.some(u => (u.username || '').toLowerCase() === normalized);
  },

  /**
   * Checks for duplicate email address (case-insensitive).
   * @param {string} email 
   * @returns {boolean}
   */
  isEmailTaken(email) {
    const normalized = (email || '').trim().toLowerCase();
    const users = this.getUsers();
    return users.some(u => (u.email || '').toLowerCase() === normalized);
  },

  /**
   * Finds an existing user by username or email (case-insensitive).
   * @param {string} identifier - Username or Email address.
   * @returns {Object|null} Matching user record or null if not found.
   */
  findUserByIdentifier(identifier) {
    const normalized = (identifier || '').trim().toLowerCase();
    if (!normalized) return null;
    const users = this.getUsers();
    return users.find(u => 
      (u.username || '').toLowerCase() === normalized || 
      (u.email || '').toLowerCase() === normalized
    ) || null;
  },

  /**
   * Registers a new user with hashed password and metadata.
   * @param {Object} userData - { username, email, passwordHash }
   * @returns {Object} Created user record
   */
  createUser({ username, email, passwordHash }) {
    const users = this.getUsers();

    const newUser = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
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
   4. Session Management Layer (sessionStorage: authVaultSession)
   ========================================================================== */
const SessionManager = {
  /**
   * Retrieves the active session from sessionStorage.
   * @returns {Object|null} Valid session payload or null.
   */
  getSession() {
    try {
      const raw = sessionStorage.getItem(AUTH_CONFIG.SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.username && parsed.email) {
        return parsed;
      }
      return null;
    } catch (err) {
      console.error('AuthVault SessionManager: Error parsing session payload', err);
      return null;
    }
  },

  /**
   * Establishes a new active session using sessionStorage.
   * Contains only the minimum account information needed to identify the logged-in user.
   * Crucial: Zero passwords or password hashes are ever included.
   * 
   * @param {Object} user - The authenticated user record { username, email }
   * @returns {Object} Created session payload
   */
  createSession(user) {
    try {
      const sessionData = {
        username: user.username,
        email: user.email,
        loggedInAt: new Date().toISOString()
      };
      sessionStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(sessionData));
      return sessionData;
    } catch (err) {
      console.error('AuthVault SessionManager: Failed to write session', err);
      throw new Error('Unable to create active session. Browser storage might be restricted.');
    }
  },

  /**
   * Destroys the active session from sessionStorage.
   */
  destroySession() {
    try {
      sessionStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
    } catch (err) {
      console.error('AuthVault SessionManager: Failed to clear session', err);
    }
  },

  /**
   * Checks whether an active, valid session currently exists.
   * @returns {boolean}
   */
  isAuthenticated() {
    return Boolean(this.getSession());
  }
};

/* ==========================================================================
   5. Validation Logic
   ========================================================================== */
const AuthValidator = {
  /**
   * Validates a username for registration.
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
   * Validates an email address for registration.
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
   * Requires at least 8 characters and at least one numeric digit.
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
   * Validates password confirmation match for registration.
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
   6. UI State & Accessible Feedback Utilities
   ========================================================================== */
const AlertUI = {
  /**
   * Displays an accessible alert box strictly using textContent (preventing XSS).
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
   7. Password Visibility Toggle Utility
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
   8. Registration Page Controller (Part 1 Core Flow — Fully Preserved)
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

  // Clear field errors upon typing
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
    // Prevent default submission to avoid URL parameters / credentials leaking
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
      // Case-insensitive duplicate check for username
      if (AuthStorage.isUsernameTaken(rawUsername)) {
        AlertUI.setFieldError(usernameInput, usernameError, 'This username is already taken. Please choose another.');
        hasErrors = true;
      } else {
        AlertUI.setFieldError(usernameInput, usernameError, null);
      }
    }

    // 2. Validate Email format & duplicates
    const emailValidation = AuthValidator.validateEmail(rawEmail);
    if (!emailValidation.isValid) {
      AlertUI.setFieldError(emailInput, emailError, emailValidation.error);
      hasErrors = true;
    } else {
      // Case-insensitive duplicate check for email
      if (AuthStorage.isEmailTaken(rawEmail)) {
        AlertUI.setFieldError(emailInput, emailError, 'An account with this email address already exists.');
        hasErrors = true;
      } else {
        AlertUI.setFieldError(emailInput, emailError, null);
      }
    }

    // 3. Validate Password requirements (>= 8 chars & at least 1 number)
    const passwordValidation = AuthValidator.validatePassword(rawPassword);
    if (!passwordValidation.isValid) {
      AlertUI.setFieldError(passwordInput, passwordError, passwordValidation.error);
      hasErrors = true;
    } else {
      AlertUI.setFieldError(passwordInput, passwordError, null);
    }

    // 4. Validate Password confirmation match
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

    // Lock button and display loading state to prevent repeated submissions
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    try {
      // Hash password using Web Crypto API SHA-256 (Never store plaintext)
      const passwordHash = await CryptoUtils.hashPassword(rawPassword);

      // Store username, email, passwordHash, and createdAt timestamp in localStorage
      AuthStorage.createUser({
        username: rawUsername,
        email: rawEmail,
        passwordHash: passwordHash
      });

      // Display success message & redirect to index.html after short delay
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
      console.error('AuthVault Registration Error:', err);
      AlertUI.show(alertEl, err.message || 'An unexpected error occurred during registration.', 'error');
      submitBtn.classList.remove('is-loading');
      submitBtn.disabled = false;
    }
  });
}

/* ==========================================================================
   9. Login Page Controller (Part 2 Core Authentication Flow)
   ========================================================================== */
function initLoginPage() {
  const form = document.getElementById('loginForm');
  if (!form) return; // Not on login page

  // If already authenticated in this session, auto-redirect to dashboard
  if (SessionManager.isAuthenticated()) {
    window.location.replace('dashboard.html');
    return;
  }

  const alertEl = document.getElementById('authAlert');
  const identifierInput = document.getElementById('loginIdentifier');
  const passwordInput = document.getElementById('loginPassword');
  const submitBtn = document.getElementById('loginSubmitBtn');

  // Setup password visibility toggle
  setupPasswordToggle('toggleLoginPasswordBtn', 'loginPassword');

  // Clear alerts upon user input
  if (identifierInput) {
    identifierInput.addEventListener('input', () => AlertUI.hide(alertEl));
  }
  if (passwordInput) {
    passwordInput.addEventListener('input', () => AlertUI.hide(alertEl));
  }

  // Handle Login Form Submission
  form.addEventListener('submit', async (e) => {
    // Prevent credentials from leaking in URL or triggering browser form reload
    e.preventDefault();

    AlertUI.hide(alertEl);

    const identifier = (identifierInput ? identifierInput.value : '').trim();
    const password = (passwordInput ? passwordInput.value : '');

    // Requirement: Reject empty username/email or password fields
    if (!identifier || !password) {
      AlertUI.show(alertEl, 'Please enter both your username/email and password.', 'error');
      return;
    }

    // Requirement: Prevent repeated button submissions while authentication is processing
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;

    try {
      // 1. Hash the submitted password using the same SHA-256 Web Crypto method
      const submittedHash = await CryptoUtils.hashPassword(password);

      // 2. Perform realistic asynchronous processing delay
      await new Promise(resolve => setTimeout(resolve, AUTH_CONFIG.AUTH_PROCESSING_DELAY_MS));

      // 3. Read existing accounts from localStorage (authVaultUsers)
      // 4. Perform case-insensitive username or email lookup
      const matchedUser = AuthStorage.findUserByIdentifier(identifier);

      // 5. Compare resulting hash against stored password hash
      const isPasswordValid = matchedUser && matchedUser.passwordHash === submittedHash;

      if (!matchedUser || !isPasswordValid) {
        // Requirement: Display the exact same generic message without revealing which credential was wrong
        AlertUI.show(alertEl, 'Invalid username/email or password.', 'error');
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
        return;
      }

      // 6. Successful authentication: establish active session in sessionStorage
      SessionManager.createSession({
        username: matchedUser.username,
        email: matchedUser.email
      });

      // Show success feedback
      AlertUI.show(alertEl, 'Authentication successful! Redirecting to dashboard...', 'success');

      // 7. Redirect to dashboard.html
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 600);

    } catch (err) {
      console.error('AuthVault Login Error:', err);
      // Graceful error message without crashing
      AlertUI.show(alertEl, 'An unexpected error occurred during authentication. Please try again.', 'error');
      submitBtn.classList.remove('is-loading');
      submitBtn.disabled = false;
    }
  });
}

/* ==========================================================================
   10. Application Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initRegistrationPage();
  initLoginPage();
});

// Expose modules to window for modular testing and Part 3 validation
window.AuthVault = {
  CryptoUtils,
  AuthStorage,
  SessionManager,
  AuthValidator,
  AlertUI,
  CONFIG: AUTH_CONFIG
};
