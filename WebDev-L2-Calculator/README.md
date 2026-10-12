# AuraCalc — Elegant Browser-Based Calculator

A precision-engineered, browser-based calculator built with **HTML5, CSS3, and Vanilla JavaScript**. Completely self-contained with no external libraries or build steps required.

---

## Part 1 Deliverable: Project Structure & Semantic HTML5

### 1. File Structure
```
WebDev-L2-Calculator/
├── index.html        # Semantic HTML5 document structure & accessibility
├── style.css         # Glassmorphic visual design system & theme tokens
├── script.js         # Vanilla JavaScript calculation logic & interaction
└── README.md         # Project documentation & architectural overview
```

---

## 2. Architecture & Semantic Elements

The markup in [`index.html`](index.html) is structured using modern HTML5 semantic elements:

| Component | Semantic HTML Element | Purpose & Description |
| :--- | :--- | :--- |
| **App Root** | `<main class="calculator-app">` | Primary application landmark wrapper |
| **Calculator Card** | `<section class="calculator-card">` | Encapsulates the entire calculator widget |
| **Brand & Header** | `<header class="calculator-header">` | Contains brand typography, logo badge, and action toolbar |
| **Toolbar Navigation** | `<nav class="calculator-toolbar">` | Quick access to Scientific drawer, History log, Sound, & Theme |
| **Screen Area** | `<section class="calculator-display">` | Hosts status indicators, expression line, primary readout, and error banner |
| **Scientific Tray** | `<div class="scientific-tray">` | Expandable drawer with functions (`sin`, `cos`, `tan`, `log`, `ln`, `√`, `x²`, `xʸ`, `π`, `e`) |
| **Memory Ribbon** | `<div class="memory-ribbon">` | Memory recall, clear, add, and subtract operations (`MC`, `MR`, `M+`, `M−`) |
| **Keypad Grid** | `<div class="calculator-keypad">` | 4-column responsive grid with digits, operators, clear, backspace, and equals |
| **Shortcuts Legend** | `<footer class="calculator-footer">` | Accessible keyboard shortcut indicators (`<kbd>`) and build caption |
| **History Drawer** | `<aside class="history-drawer">` | Slide-out panel maintaining calculation history and quick replay |

---

## 3. Accessibility & Usability (WCAG Compliant)

- **Semantic Tags & ARIA Roles**: Every button uses `<button type="button">`, with explicit `aria-label`, `aria-pressed`, `aria-expanded`, and `aria-controls` bindings.
- **Screen Reader Announcements**: The display area uses `aria-live="polite"` and `aria-atomic="true"` for real-time calculation narration. Error banners utilize `role="alert"` and `aria-live="assertive"`.
- **Data Attributes for Decoupled Logic**: Every button contains explicit `data-action`, `data-type`, `data-value`, and `data-key` attributes, allowing the JavaScript controller to bind seamlessly without brittle DOM querying.
- **Keyboard Navigation**: Interactive controls support both mouse/touch taps and hardware keyboard input (`0-9`, `+`, `-`, `*`, `/`, `Enter`, `Escape`, `Backspace`).

---

## 4. How to Run Locally

Because this project is built entirely in Vanilla Web standards without dependencies:

1. Double-click [`index.html`](index.html) to open directly in any modern browser (Chrome, Edge, Firefox, Safari).
2. Alternatively, serve via any lightweight static server:
   ```bash
   python -m http.server 8080
   # Then visit http://localhost:8080 in your browser
   ```
