/**
 * AuthVault — Secure Authentication System
 * Part 2: Protected Dashboard Controller & Session Route Guard
 * 
 * Responsibilities:
 * - Immediate session authentication check upon document load.
 * - Prevents flash of unauthenticated content (FOUC) by gating layout display.
 * - Displays authenticated user's username and email strictly via textContent (XSS immunity).
 * - Implements logout by purging 'authVaultSession' from sessionStorage and redirecting.
 * - Guards against bfcache (back/forward cache) restoration after logout.
 */

'use strict';

(function () {
  const SESSION_KEY = 'authVaultSession';

  /**
   * Retrieves and parses the active session from sessionStorage safely.
   * @returns {Object|null} Session payload or null if absent/invalid.
   */
  function getActiveSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (session && typeof session === 'object' && session.username && session.email) {
        return session;
      }
      return null;
    } catch (err) {
      console.error('AuthVault Dashboard: Failed to read session payload', err);
      return null;
    }
  }

  /**
   * Terminates the active session and redirects to the login portal.
   */
  function handleLogout() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (err) {
      console.error('AuthVault Dashboard: Error clearing session:', err);
    }
    // Replace state in history to prevent back navigation
    window.location.replace('index.html');
  }

  /**
   * Evaluates authentication state, populates profile elements, or redirects.
   */
  function enforceSessionGuard() {
    const session = getActiveSession();

    if (!session) {
      // Unauthenticated visitor: redirect immediately without rendering protected content
      window.location.replace('index.html');
      return;
    }

    // Authenticated visitor: reveal protected dashboard container
    const dashboardContainer = document.getElementById('protectedDashboard');
    if (dashboardContainer) {
      dashboardContainer.style.display = 'block';
      dashboardContainer.classList.add('is-authenticated');
    }

    // Populate user profile and session info strictly using textContent
    const welcomeUsernameEl = document.getElementById('welcomeUsername');
    const navUsernameEl = document.getElementById('navUsername');
    const avatarInitialEl = document.getElementById('avatarInitial');
    const profileUsernameEl = document.getElementById('profileUsername');
    const profileEmailEl = document.getElementById('profileEmail');
    const profileSessionTimeEl = document.getElementById('profileSessionTime');

    if (welcomeUsernameEl) {
      welcomeUsernameEl.textContent = session.username;
    }

    if (navUsernameEl) {
      navUsernameEl.textContent = session.username;
    }

    if (avatarInitialEl && session.username) {
      avatarInitialEl.textContent = session.username.charAt(0).toUpperCase();
    }

    if (profileUsernameEl) {
      profileUsernameEl.textContent = session.username;
    }

    if (profileEmailEl) {
      profileEmailEl.textContent = session.email;
    }

    if (profileSessionTimeEl) {
      try {
        const timeFormatted = session.loggedInAt ? new Date(session.loggedInAt).toLocaleString() : 'Active';
        profileSessionTimeEl.textContent = timeFormatted;
      } catch {
        profileSessionTimeEl.textContent = 'Active';
      }
    }

    // Safely update registered accounts count from localStorage
    const registeredCountEl = document.getElementById('registeredAccountsCount');
    if (registeredCountEl) {
      try {
        const rawUsers = localStorage.getItem('authVaultUsers');
        const users = rawUsers ? JSON.parse(rawUsers) : [];
        registeredCountEl.textContent = String(Array.isArray(users) ? users.length : 1);
      } catch {
        registeredCountEl.textContent = '1';
      }
    }
  }


  // Setup DOM event bindings
  document.addEventListener('DOMContentLoaded', () => {
    enforceSessionGuard();

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
  });

  // Guard against browser Back/Forward Cache (bfcache) navigation
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      enforceSessionGuard();
    }
  });

})();
