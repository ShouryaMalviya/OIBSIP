# AuraCalc — Elegant Browser-Based Calculator

A precision-engineered, browser-based calculator built with **HTML5, CSS3, and Vanilla JavaScript**. Completely self-contained with no external libraries or build steps required.

---

## Project Structure
```
WebDev-L2-Calculator/
├── index.html        # Semantic HTML5 document structure & accessibility
├── style.css         # Artisanal CSS3 design system & bespoke color tokens
├── script.js         # Custom Shunting-Yard calculation engine & state
└── README.md         # Comprehensive project documentation
```

---

## Part 4: Calculation Engine, Operator Handling & Error Management

### 1. Safe Arithmetic Evaluation (Zero `eval`, Zero `Function`)
- **Strict Prohibition Adherence**: Completely eliminates JavaScript's `eval()` and the `Function()` constructor for security and stability.
- **Architectural Design**:
  1. **Lexical Tokenizer (`tokenize`)**: Scans input and parses numbers, decimal segments, algebraic operators (`+`, `−`, `×`, `÷`, `^`, `%`), parentheses, unary negatives (`neg`), and scientific functions (`sin`, `cos`, `tan`, `log`, `ln`, `sqrt`).
  2. **Dijkstra's Shunting-Yard Algorithm (`shuntingYard`)**: Converts the infix token stream into Reverse Polish Notation (RPN / Postfix).
  3. **Stack-Based RPN Evaluator (`evaluateRPN`)**: Evaluates the postfix stream with boundary checks and division-by-zero detection.

### 2. Precedence Convention (BODMAS / PEMDAS)
The calculator strictly follows **Standard Algebraic Mathematical Precedence**:
- **Parentheses**: `( ... )` take highest precedence.
- **Exponents**: `^` evaluated next (right-associative).
- **Multiplication & Division**: `×`, `÷`, `%` evaluated before addition/subtraction (left-associative).
- **Addition & Subtraction**: `+`, `−` evaluated last (left-associative).

**Examples**:
- `5 + 3 =` → `8`
- `10 - 4 =` → `6`
- `6 × 7 =` → `42`
- `20 ÷ 4 =` → `5`
- `5 + 3 × 2 =` → `11` (BODMAS: `3 × 2 = 6`, `5 + 6 = 11`)
- `(5 + 3) × 2 =` → `16`

### 3. Division-by-Zero & Error Protection
- **Pre-Execution Check**: Explicit zero divisor check (`Math.abs(b) < 1e-15`) triggers immediately without crashing the interface or outputting `Infinity`.
- **Friendly Error Feedback**: Inset error alert displays `"Cannot divide by zero"`.
- **Seamless Recovery**: The calculator remains interactive. Typing any digit or clicking `C` automatically resets the error state.

### 4. Comprehensive Edge Case Handling
| Edge Case | Behavior & Resolution |
| :--- | :--- |
| **Incomplete Expression (e.g. `5 + =`)** | Caught safely, displaying `"Incomplete expression"` without crashing. |
| **Repeated Operators (e.g. `5 + × ÷ − 3`)** | Automatically replaces trailing operators with the latest operator (`5 − 3 = 2`). |
| **Multiple Decimals (e.g. `3.14.5`)** | Prevents subsequent decimal points within the same active numerical token. |
| **Leading Decimals (e.g. `.5`)** | Automatically normalized as `0.5`. |
| **Negative Operations (e.g. `-10 ÷ 2`)** | Evaluates correctly as `-5`. |
| **Subtracting Larger from Smaller (e.g. `5 − 12`)** | Evaluates correctly as `-7`. |
| **Excessive Decimal Precision (e.g. `0.1 + 0.2`)** | Formatted to 12 significant figures, eliminating IEEE 754 micro-rounding residues (`0.3`). |
| **Extreme Numbers** | Formatted into clean scientific notation (e.g., `1.5e+15`). |
| **Backspace on Empty Input** | Gracefully retains `0` without breaking internal state. |
| **Chaining from Evaluated Result** | Pressing an operator after `=` chains the result (`8 + 2 = 10`, `× 5 = 50`). |
| **Fresh Calculation after Equals** | Typing a digit immediately starts a new calculation. |

### 5. Physical Keyboard Navigation
- Numeric input: `0`–`9` and `.`.
- Operators: `+`, `-`, `*`, `/` (mapped to `+`, `−`, `×`, `÷`).
- Evaluation: `Enter` or `=`.
- Backspace: `Backspace` deletes characters safely.
- Clear: `Escape`, `c`, or `C`.
- `e.preventDefault()` prevents browser shortcuts (e.g., Firefox quick-find `/` or page refresh).
- Visual depression feedback (`.btn-active`) animates keys when typed via keyboard.

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
- **Deep Teal on Cream**: ~12:1 contrast ratio.
- **Cream / White on Maroon**: ~13:1 contrast ratio.
- **Deep Teal on Taupe**: ~7.4:1 contrast ratio.
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
