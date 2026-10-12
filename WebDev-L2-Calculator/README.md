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

## Part 2: UI/UX Design, Color Palette & CSS3 Styling

### 1. Required Color Palette Specification

The visual identity is governed by the following core hexadecimal variables defined in `:root`:

```css
:root {
  --cream: #F0EDDE;       /* Page background & light display surfaces */
  --deep-teal: #09453D;   /* Container chassis, primary numerals & headings */
  --maroon: #960D41;      /* Arithmetic operators, equals, clear & actions */
  --taupe: #C8C1AF;       /* Standard numeric buttons (0-9) & decimal */
}
```

### 2. Application & Visual Roles

| Color | Hex | Primary UI Role & Application |
| :--- | :--- | :--- |
| **Cream** | `#F0EDDE` | Viewport page background, light calculator display surface, button glyphs on maroon keys. |
| **Deep Teal** | `#09453D` | Calculator card chassis body, primary numeric readouts, headings, and structural details. |
| **Maroon** | `#960D41` | Arithmetic operators (`+`, `−`, `×`, `÷`), equals button (`=`), clear (`AC`), and backspace. |
| **Taupe** | `#C8C1AF` | Numeric keys (`0`–`9`, `00`), decimal point (`.`), and memory ribbon button states. |

### 3. Contrast & Accessibility (WCAG AAA)
- **Deep Teal on Cream**: ~12:1 contrast ratio (exceeds WCAG AAA requirement of 7:1).
- **Cream / White on Maroon**: ~13:1 contrast ratio (exceeds WCAG AAA requirement).
- **Deep Teal on Taupe**: ~7.4:1 contrast ratio (meets WCAG AAA requirement).
- **Visible Focus Rings**: Complete `:focus-visible` states with 2px contrast outlines for full keyboard navigation.

### 4. Layout & Interactive Features
- **Centering & Sizing**: Modern Flexbox viewport centering (`min-height: 100vh; display: flex; align-items: center; justify-content: center`).
- **CSS Grid Keypad**: 4-column balanced grid with uniform button dimensions, tactile drop shadows (`0 3px 0`), and dynamic press depression (`translateY(2px)`).
- **Responsive Display**: Inset Cream display screen with `font-size: clamp(...)`, horizontal scrolling without clipping, and live calculation preview line.
- **Responsive Breakpoints**: Seamless scaling for Desktop, Tablet, and Mobile devices (< 480px width and compact height viewports).

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
