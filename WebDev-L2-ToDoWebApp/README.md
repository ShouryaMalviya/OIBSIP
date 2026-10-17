# TaskFlow · Interactive To-Do Web Application
> **Oasis Infobyte (OIBSIP) Web Development Internship — Task 3**  
> A modern, high-performance, and feature-rich daily task management web app built with Vanilla HTML5, CSS3, and JavaScript.

---

## 🌟 Overview

**TaskFlow** delivers a seamless productivity experience inspired by modern SaaS interfaces like Linear and Things 3. It organizes your daily workflow into distinct **Pending Tasks** and **Completed Tasks** boards, equipped with instant inline editing, interactive completion toggles, timestamps, local persistence, sound feedback, and celebratory confetti.

---

## 📋 Feature Checklist

| Requirement | Status | Description |
| :--- | :---: | :--- |
| **Input field + "Add Task" button** | ✅ Implemented | Intuitive quick-add bar with category, priority, and due date pickers |
| **Immediate Pending list display** | ✅ Implemented | Newly created tasks animate instantly to the top of the Pending Tasks column |
| **"Mark Complete" toggle** | ✅ Implemented | Interactive checkbox toggle smoothly transitions tasks between Pending & Completed with confetti |
| **Inline Editing** | ✅ Implemented | Edit button converts task text into an inline input with Save (`Enter`) & Cancel (`Esc`) |
| **Delete Functionality** | ✅ Implemented | Permanently remove tasks from either list with an instant 5-second **Undo Toast** |
| **Task Count Indicators** | ✅ Implemented | Real-time `"X pending"` and `"Y completed"` badges + interactive progress dashboard |
| **(Bonus) Timestamps** | ✅ Implemented | Displays relative creation and completion times with full exact date tooltips |
| **(Bonus) LocalStorage Persistence** | ✅ Implemented | All tasks, edits, completions, and settings persist across page reloads |
| **Empty State Messaging** | ✅ Implemented | Delightful illustrated empty states when lists are clear or search yields no results |

---

## ✨ Additional Features

- 🌓 **Dark & Light Mode**: Glassmorphic theme switcher with persistence in `localStorage`.
- 🔊 **Zero-Asset Web Audio Synthesizer**: Subtle clicks, completion chimes, and delete tones generated dynamically using Web Audio API (completely offline, toggleable with mute hotkey).
- 🎉 **Confetti Burst**: Rewarding visual celebration on checking off tasks.
- 🔍 **Live Search & Filters**: Instant search by task keywords, filter by category (`Work`, `Personal`, `Study`, `Health`, `Shopping`, `Other`), and filter by priority (`High`, `Medium`, `Low`).
- 🔄 **Sort Options**: Sort by Newest First, Oldest First, Priority, or Alphabetical.
- 💾 **Data Export & Import**: Backup tasks to `.json` and restore them at any time.
- ⌨️ **Keyboard Shortcuts**:
  - `N`: Focus new task input
  - `/`: Focus search box
  - `D`: Toggle Dark/Light mode
  - `M`: Toggle audio feedback
  - `Esc`: Cancel editing or close modal
  - `?`: Open keyboard shortcuts cheat sheet

---

## 🛠️ Tech Stack

- **Markup**: Semantic HTML5 with accessibility attributes (`aria-*`, `role`) and unique IDs.
- **Styling**: Vanilla CSS3 using custom CSS variables (Design Tokens), Glassmorphism (`backdrop-filter`), CSS Grid, Flexbox, and micro-animations.
- **Logic**: Modern Vanilla JavaScript (ES6+), Event Delegation, Web Audio API, Web Storage API.
- **Typography**: Google Fonts (*Outfit* for headings, *Plus Jakarta Sans* for UI body text).

---

## 🚀 Getting Started

No build step or dependencies required. Open directly in any modern browser:

### Option 1: Direct File Opening
Double-click `index.html` or open it with your favorite browser.

### Option 2: Local HTTP Server (Python)
```bash
# In the project directory:
python -m http.server 5173
```
Then navigate to: `http://localhost:5173/`

### Option 3: Local HTTP Server (Node.js)
```bash
npx serve .
```

---

## 📁 File Structure

```
WebDev-L2-ToDoWebApp/
├── index.html       # Semantic HTML5 layout and modal structures
├── css/
│   └── style.css    # Responsive design tokens, glassmorphism, and animations
├── js/
│   └── app.js       # App state, event delegation, audio synthesizer, and localStorage
└── README.md        # Project documentation
```

---

*Designed and developed by Shourya Malviya for Oasis Infobyte (OIBSIP).*
