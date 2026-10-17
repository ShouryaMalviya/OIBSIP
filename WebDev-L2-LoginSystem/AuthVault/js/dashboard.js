/**
 * AuthVault — Secure Authentication System
 * Part 1: Dashboard Foundation Script
 * 
 * NOTE: Full session management and route guards will be wired in Part 2.
 * This foundation exposes metrics and inspects stored vault users safely.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'authVaultUsers';
  const registeredAccountsCountEl = document.getElementById('registeredAccountsCount');
  const profileUsernameEl = document.getElementById('profileUsername');
  const profileEmailEl = document.getElementById('profileEmail');
  const profileHashEl = document.getElementById('profileHash');
  const profileRegisteredAtEl = document.getElementById('profileRegisteredAt');
  const navUsernameEl = document.getElementById('navUsername');
  const avatarInitialEl = document.getElementById('avatarInitial');
  const logoutBtn = document.getElementById('logoutBtn');

  // Load registered users count from localStorage safely
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const users = raw ? JSON.parse(raw) : [];
    
    if (registeredAccountsCountEl) {
      registeredAccountsCountEl.textContent = String(users.length);
    }

    // If users exist, display the most recently registered account as an audit preview
    if (users.length > 0) {
      const latestUser = users[users.length - 1];
      if (profileUsernameEl) profileUsernameEl.textContent = latestUser.username;
      if (profileEmailEl) profileEmailEl.textContent = latestUser.email;
      if (profileHashEl) {
        // Truncate hash for display preview
        profileHashEl.textContent = latestUser.passwordHash ? `${latestUser.passwordHash.substring(0, 16)}...` : '—';
        profileHashEl.title = latestUser.passwordHash || '';
      }
      if (profileRegisteredAtEl && latestUser.createdAt) {
        profileRegisteredAtEl.textContent = new Date(latestUser.createdAt).toLocaleString();
      }
      if (navUsernameEl) navUsernameEl.textContent = latestUser.username;
      if (avatarInitialEl && latestUser.username) {
        avatarInitialEl.textContent = latestUser.username.charAt(0).toUpperCase();
      }
    }
  } catch (err) {
    console.error('AuthVault: Error loading user metrics:', err);
  }

  // Logout button handler (Foundation for Part 2 session termination)
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      // In Part 2, active session token will be cleared here
      window.location.href = 'index.html';
    });
  }
});
