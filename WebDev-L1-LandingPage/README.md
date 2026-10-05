# 🌌 MEPHISTO — The Quantum Neural Interface

> A minimalist, futuristic, and high-performance static landing page for **Mephisto**, an autonomous quantum computing workstation and neural interface. Built strictly using modern **HTML5** and **CSS3** with **zero JavaScript**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-None%20(Pure%20CSS)-red.svg)](#tech-stack)
[![Status](https://img.shields.io/badge/Design-Futuristic%20Glassmorphism-00f0ff.svg)](#design-system)

---

## 📖 Overview

**Mephisto** represents a paradigm shift in human-machine symbiosis. This landing page is engineered to reflect an ultra-premium, warm, earthy, and light aesthetic using an architectural luxury color palette: **Ivory** base (`#F5E6C5`), **Apricot** accents & CTAs (`#D78B30`), **Natural** borders & secondary elements (`#9F886F`), and high-contrast **Organic** dark typography (`#3F422E`).

The site is built adhering strictly to the constraint of **NO JavaScript** — all interactive features (smooth scrolling, sticky header blur, diagnostic waveform visualizer, card hover effects, and a mobile hamburger drawer navigation) are powered purely by native CSS3 techniques.

---

## ✨ Features Checklist Compliance

| Requirement | Implementation Detail | Status |
| :--- | :--- | :---: |
| **Sticky Navigation Bar** | Sticky header with blur backdrop filter (`backdrop-filter: blur(16px)`), brand logo glyph, 4 distinct navigation links (`Features`, `Specs`, `Reviews`, `Pricing`), and a highlighted CTA button. | ✅ |
| **Hero Section** | High-impact headline, subheadline, dual action buttons (`Secure Your Unit` & `View Technical Specs`), operational telemetry metrics, and a pure CSS diagnostic terminal HUD. | ✅ |
| **Content Section 1: Capabilities** | 6-card CSS Grid showcasing quantum features with warm Apricot hover borders, custom SVGs, and category pills. | ✅ |
| **Content Section 2: Hardware Architecture** | Responsive technical specification comparison matrix between Mephisto and legacy superclusters. | ✅ |
| **Content Section 3: Verified Reviews** | Social proof grid featuring testimonials from verified deep tech researchers with avatar badges and star ratings. | ✅ |
| **Content Section 4: Deployment Tiers** | 3-tier pricing matrix with an elevated "Most Requested" sovereign tier and tier comparison lists. | ✅ |
| **Footer** | Comprehensive 4-column layout including company overview, navigation links, documentation directory, physical lab coordinates, email, and social media channels. | ✅ |
| **Consistent Color Palette** | Ivory base (`#F5E6C5`), Apricot accents (`#D78B30`), Natural borders (`#9F886F`), and Organic typography (`#3F422E`). | ✅ |
| **Responsive Layout** | 100% fluid Flexbox and CSS Grid architecture with breakpoints for desktops (1200px), tablets (1024px, 768px), and mobile devices (480px). | ✅ |
| **Zero Element Overlap** | Universal `box-sizing: border-box`, clean padding and margin distribution, and proper z-index layering. | ✅ |
| **Clean Typography** | Dual Google Fonts hierarchy (`Space Grotesk` for headlines, `Inter` for body copy, and `JetBrains Mono` for telemetry and code). | ✅ |
| **Zero JavaScript** | 100% pure HTML5 and CSS3. Mobile menu toggle is powered entirely by the pure CSS checkbox hack (`#nav-toggle:checked ~ .nav-menu`). | ✅ |

---

## 🛠️ Tech Stack

- **HTML5**: Semantic tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<table>`, `<footer>`).
- **CSS3**:
  - CSS Custom Properties (Variables for design tokens)
  - CSS Grid & Flexbox layout models
  - Glassmorphism & `backdrop-filter`
  - Pure CSS animations (`@keyframes` for ambient glowing orbs, pulse dots, and diagnostic waveform meters)
  - Pure CSS responsive navigation drawer using the checkbox hack
  - Media queries for multi-device responsiveness
- **Typography**: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk), [Inter](https://fonts.google.com/specimen/Inter), and [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono).
- **Icons & Graphics**: Inline SVG glyphs for instant rendering without external icon font dependencies.

---

## 🎨 Design System & Luxury Palette

| Token / Variable Name | Value / Hex Code | Purpose |
| :--- | :--- | :--- |
| `--color-ivory` / `--bg-deep` | `#F5E6C5` | Base canvas and main body background (Ivory) |
| `--color-apricot` / `--accent-primary` | `#D78B30` | Primary CTA buttons, badges, highlights & active states (Apricot) |
| `--color-natural` / `--text-dim` | `#9F886F` | Secondary labels, borders, dividers, and accents (Natural) |
| `--color-organic` / `--text-main` | `#3F422E` | High-contrast primary headings, dark elements & body text (Organic) |
| `--bg-secondary` | `#EFE0BD` | Warm alternate section background |
| `--bg-card` | `rgba(255, 253, 248, 0.85)` | Warm luxury elevated card surfaces |
| `--border-light` | `rgba(159, 136, 111, 0.28)` | Natural refined component borders |
| `--shadow-md` | `rgba(63, 66, 46, 0.08)` | Soft, elegant, and natural drop shadows |

---

## 🚀 How to Run the Project

Since this project uses no external libraries, build steps, or JavaScript frameworks, running it is completely plug-and-play.

### Option 1: Direct File Open
1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/mephisto-landing-page.git
   ```
2. Navigate to the project directory:
   ```bash
   cd mephisto-landing-page
   ```
3. Double-click `index.html` or right-click and choose **Open with... > Google Chrome / Brave / Edge / Firefox**.

### Option 2: Using VS Code Live Server
1. Open the project folder in Visual Studio Code.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click on `index.html` and select **"Open with Live Server"** (or press `Alt + L, Alt + O`).
4. The page will launch automatically at `http://127.0.0.1:5500`.

### Option 3: Using Python Built-in Server
If you have Python installed, open your terminal in the project directory and run:
```bash
# Python 3.x
python -m http.server 8000
```
Then visit `http://localhost:8000` in your web browser.

---

## 📂 Project Structure

```plaintext
WebDev-L1-LandingPage/
├── index.html        # Complete semantic HTML5 structure & content
├── style.css         # Modern CSS3 design tokens, layouts, animations & responsive queries
└── README.md         # Professional documentation & repository guide
```

---

## 📱 Mobile Responsiveness Preview

- **Desktop (1024px+)**: Full two-column hero with live CSS diagnostic HUD, multi-column feature grid, full specification matrix, and horizontal navigation bar.
- **Tablet (768px - 1023px)**: Stacked hero layout, dual-column feature cards, full specs table with horizontal scroll safeguarding, and compact stats.
- **Mobile (< 768px)**: Hidden desktop navigation replaced with a pure CSS animated hamburger menu, full-width responsive buttons, single-column feature and pricing cards, and optimized touch targets.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — feel free to use, modify, and distribute it for educational or commercial purposes.

---

*Engineered with precision for the Oasis Infobyte Web Development Internship (OIBSIP Task 1).*
