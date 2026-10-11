# Temperature Converter Web Application

A clean, responsive, and mathematically accurate Temperature Converter built with **HTML5**, **CSS3**, and **Vanilla JavaScript**. This project converts temperature values seamlessly across **Celsius (°C)**, **Fahrenheit (°F)**, and **Kelvin (K)** simultaneously, featuring real-time input validation, accessible status alerts, and strict physical limit (Absolute Zero) verification.

---

## 🚀 Live & Local Usage

This application is completely standalone and requires **no build tools, frameworks, or npm dependencies**.

### Quick Run
1. Clone or download this repository.
2. Open `index.html` directly in any modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).
3. Alternatively, launch a lightweight local server:
   ```bash
   python -m http.server 8000
   ```
   and navigate to `http://localhost:8000`.

---

## 🌟 Key Features

1. **Simultaneous Multi-Unit Conversion:**
   - Select any input unit (Celsius, Fahrenheit, or Kelvin) and view converted values across all three units at once.
2. **Mathematically Accurate Formulas:**
   - Celsius to Fahrenheit: `°F = (°C × 9/5) + 32`
   - Fahrenheit to Celsius: `°C = (°F − 32) × 5/9`
   - Celsius to Kelvin: `K = °C + 273.15`
   - Kelvin to Celsius: `°C = K − 273.15`
   - Standardizes calculations through a base Celsius scale to prevent floating-point accumulation.
3. **Rigorous Input Validation & Edge-Case Handling:**
   - **Empty Inputs:** Prompts user with *"Please enter a temperature."* on submission.
   - **Non-Numeric Detection:** Strictly rejects invalid inputs (e.g., `abc`, `25abc`, `--10`, isolated decimal `.`) using strict regex rather than permissive `parseFloat()`.
   - **Absolute Zero Enforcement:** Rejects physically invalid values strictly below absolute zero (`−273.15 °C`, `−459.67 °F`, `0 K`) with an informative advisory message. Values exactly at absolute zero are accepted.
4. **Real-Time Input Synchronization:**
   - Dynamically validates while typing.
   - Automatically clears obsolete errors when the input becomes valid.
   - Resets displayed cards to `--` when input is erased or invalid to prevent misleading results.
5. **Modern, Responsive Design & Accessibility:**
   - Deep navy glassmorphism aesthetic with cyan, blue, and violet accent styling.
   - Fully responsive grid layout supporting desktops, laptops, tablets, and smartphones.
   - Semantic HTML5 structure (`<main>`, `<header>`, `<form>`, `<section>`, `<article>`, `<footer>`).
   - Accessible error handling via `role="alert"` and `aria-live="polite"`.
   - Keyboard interaction support (<kbd>Enter</kbd> triggers conversion without page reload).
   - In-field quick-clear button and secondary application reset button.

---

## 🧪 Verified Test Cases

| Input Value | Selected Unit | Celsius (°C) | Fahrenheit (°F) | Kelvin (K) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `0` | Celsius | `0.00` | `32.00` | `273.15` | ✅ Passed |
| `100` | Celsius | `100.00` | `212.00` | `373.15` | ✅ Passed |
| `32` | Fahrenheit | `0.00` | `32.00` | `273.15` | ✅ Passed |
| `212` | Fahrenheit | `100.00` | `212.00` | `373.15` | ✅ Passed |
| `273.15` | Kelvin | `0.00` | `32.00` | `273.15` | ✅ Passed |
| `0` | Kelvin | `-273.15` | `-459.67` | `0.00` | ✅ Passed |
| `-273.15` | Celsius | `-273.15` | `-459.67` | `0.00` | ✅ Passed |
| `-273.16` | Celsius | — | — | — | ❌ Rejected (Below Absolute Zero) |
| `-459.68` | Fahrenheit | — | — | — | ❌ Rejected (Below Absolute Zero) |
| `-10` | Kelvin | — | — | — | ❌ Rejected (Negative Kelvin) |
| `25abc` | Celsius | — | — | — | ❌ Rejected (Non-numeric text) |

---

## 📁 Project Structure

```text
WebDev-L1-TemperatureConverter/
├── index.html     # Semantic HTML5 markup, accessibility tags & structure
├── style.css      # Custom Vanilla CSS3 styling, design tokens & responsive media queries
├── script.js     # Vanilla JavaScript conversion engine & validation logic
└── README.md      # Project documentation, instructions & test specifications
```

---

## 🎓 Internship & Submission Summary

- **Project:** Level 1 — Temperature Converter Website
- **Technologies:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Author:** Shourya Malviya
- **Key Focus Areas:** Code cleanliness, mathematical accuracy, responsive UI/UX, input validation, WCAG accessibility.
