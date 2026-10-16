# AuraCalc — Elegant Browser-Based Calculator

A precision-engineered, browser-based calculator built with **HTML5, CSS3, and Vanilla JavaScript**. Completely self-contained with no external libraries or build steps required.

---

## Project Structure
```
WebDev-L2-Calculator/
├── index.html        # Semantic HTML5 document structure & accessibility
├── style.css         # Artisanal CSS3 design system & bespoke color tokens
├── script.js         # Vanilla JavaScript calculation logic, audio & state
└── README.md         # Comprehensive project documentation
```

---

## Part 3: Calculator Interface & Core Functionality

### 1. Display System
- **Dual Display Architecture**:
  - **Primary Screen (`#display-primary`)**: Displays active numeric input as typed, live updates, and final evaluated results upon pressing equals.
  - **Secondary Expression Track (`#display-expression`)**: Shows the ongoing mathematical equation and completed formula with trailing `=` after calculation.
  - **Live Sub-Result Preview (`#display-preview`)**: Instant dynamic evaluation preview displayed in real-time as operands and operators are entered.
- **Overflow & Long Expression Resilience**:
  - Horizontal auto-scrolling (`scrollLeft = scrollWidth`) ensures newly entered digits remain continuously in view without breaking the layout.
  - Clean floating-point precision formatting resolves IEEE 754 micro-rounding issues (e.g., `0.1 + 0.2 = 0.3`).

### 2. Numeric Input & Decimal Rules
- **Digits Supported**: `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, and `00`.
- **Decimal Point (`.`)**:
  - Prevents duplicate decimal points within any active numerical segment.
  - Automatically prefixes leading zeros for expressions starting with a decimal point (e.g., `.5` becomes `0.5`).
  - Supports decimals immediately following operators (e.g., `12 + .` evaluates cleanly as `12 + 0.`).
- **Zero & Negative Number Handling**:
  - Eliminates unintended leading zeros (e.g., entering `5` when display is `0` replaces the zero with `5`).
  - Standalone `0` after operators (e.g., `12 + 0`) is replaced when subsequent digits are typed.
  - Dedicated sign toggle (`±`) supports negative numbers and sub-expression operand inversion.

### 3. Arithmetic Operators & Chaining
- **Operators**: Addition (`+`), Subtraction (`−`), Multiplication (`×`), and Division (`÷`).
- **Operator Replacement**: Repeated operator clicks dynamically replace the preceding operator (e.g., `12 + ` followed by `×` smoothly transitions to `12 × `).
- **Chained Calculations**: Direct chaining from evaluated results (e.g., `5 + 3 = 8` followed by `× 2` continues seamlessly from `8 × 2 = 16`).

### 4. Control Buttons
- **Clear (C / AC)**:
  - Dynamically displays `C` while an operation is in progress and `AC` when in initial state.
  - Completely resets the current calculation, expression tracks, and error notices.
- **Backspace (⌫)**:
  - Deletes characters one by one with clean fallback to `0` when empty.
  - Safely deletes entire multi-character operators with surrounding spaces (` + `), function prefixes, and decimals without leaving the calculator in an inconsistent state.
- **Equals (=)**:
  - Safely evaluates expressions using isolated evaluation.
  - Detects division by zero (e.g., `8 ÷ 0`) and gracefully alerts `"Cannot divide by zero"` without crashing or outputting `Infinity`.
  - Automatically records completed equations in the slide-out calculation history log.

### 5. Event Handling & Keyboard Shortcuts
- Bound exclusively through `addEventListener()` (zero inline HTML event attributes).
- Event delegation on `.calculator-keypad` for performant, predictable interaction.
- **Hardware Keyboard Mapping**:
  - `0`–`9` & `.` for numbers and decimals.
  - `+`, `-`, `*`, `/` for operators.
  - `Enter` or `=` for equals.
  - `Backspace` for delete.
  - `Escape`, `c`, `C` for clear.
  - `(` and `)` for parentheses.
  - Active button visual feedback (`.btn-active`) mirrors physical keypresses on screen.

---

## Part 2: UI/UX Design, Color Palette & CSS3 Styling

### Required Color Palette Specification
```css
:root {
  --cream: #F0EDDE;       /* Page background & light display surfaces */
  --deep-teal: #09453D;   /* Container chassis, primary numerals & headings */
  --maroon: #960D41;      /* Arithmetic operators, equals, clear & actions */
  --taupe: #C8C1AF;       /* Standard numeric buttons (0-9) & decimal */
}
```

### Contrast & Accessibility (WCAG AAA)
- **Deep Teal on Cream**: ~12:1 contrast ratio (exceeds WCAG AAA).
- **Cream / White on Maroon**: ~13:1 contrast ratio (exceeds WCAG AAA).
- **Deep Teal on Taupe**: ~7.4:1 contrast ratio (meets WCAG AAA).
- **Focus Rings**: `:focus-visible` with 2px high-contrast outlines for accessible keyboard navigation.

---

## Part 1: HTML5 Architecture & Semantics

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

## How to Run Locally

Because this project is built entirely with vanilla web standards:

1. Double-click [`index.html`](index.html) to open directly in any modern browser (Chrome, Edge, Firefox, Safari).
2. Or run a lightweight local static server:
   ```bash
   python -m http.server 8080
   ```
