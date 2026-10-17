/**
 * Tribute Page — Dr. A.P.J. Abdul Kalam
 * Part 1: Minimal Vanilla JavaScript Foundation
 * 
 * Note: The website is fully functional without JavaScript.
 * This script provides lightweight progressive enhancement and acts
 * as the foundation for any interactive features introduced in future parts.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Confirm script initialization for developer inspection
  console.info('Tribute Page — Dr. A.P.J. Abdul Kalam initialized successfully.');

  // Smooth scroll fallback and accessibility focus management for in-page anchors
  const internalLinks = document.querySelectorAll('a[href^="#"]');

  internalLinks.forEach(link => {
    link.addEventListener('click', event => {
      const targetId = link.getAttribute('href');
      
      // Allow default behavior if href is just '#' or invalid
      if (!targetId || targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // Ensure the target element can receive focus for keyboard/screen-reader users
        if (!targetElement.hasAttribute('tabindex')) {
          targetElement.setAttribute('tabindex', '-1');
        }
        targetElement.focus({ preventScroll: true });
      }
    });
  });
});
