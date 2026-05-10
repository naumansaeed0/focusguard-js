# ◎ FocusGuard

> Anti-distraction productivity dashboard built with vanilla JavaScript.

![Status](https://img.shields.io/badge/status-active-success?style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6_Modules-f0a500?style=flat-square&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

**[Live Demo →](https://naumansaeed0.github.io/focusguard-js/)**

---

## Overview

FocusGuard is a Pomodoro-based focus dashboard that helps you stay in the zone. It pairs a persistent timer with a task queue and session analytics — all without a framework, build step, or backend.

Built as Day 5–6 of a 6-day vanilla JavaScript sprint, after a Task Tracker (Days 1–2) and Weather App (Days 3–4).

---

## Features

- **Pomodoro timer** — 25 min focus / 5 min break with pause and resume
- **Persistent state** — timer survives page refresh and corrects for elapsed time
- **Task queue** — link tasks to sessions; active task surfaces in the timer
- **Session history** — logged per day with duration and task name
- **Daily stats** — focus time, session count, completed tasks
- **Streak tracking** — consecutive active days
- **Weekly chart** — 7-day bar chart rendered without a library
- **Browser notifications** — fires on session end via Notification API
- **Keyboard shortcuts** — `Space` start/pause · `N` new task · `R` reset
- **Responsive** — 3-column desktop, stacked mobile

---

## Architecture

No framework. No build step. ES6 modules loaded natively by the browser.

```
focusguard-js/
├── index.html          # Semantic markup, no logic
├── style.css           # Design system with CSS variables
└── js/
    ├── app.js          # Entry point — event wiring only
    ├── timer.js        # setInterval state machine
    ├── tasks.js        # Task queue with in-memory cache
    ├── stats.js        # Analytics: reduce(), groupBy, streaks
    ├── storage.js      # localStorage abstraction layer
    ├── notifications.js # Notification API wrapper
    ├── ui.js           # All DOM rendering — no logic
    └── helpers.js      # Pure utility functions
```

### Dependency direction

```
index.html
    └── app.js (entry — imports everything)
            ├── timer.js      → storage.js, helpers.js
            ├── tasks.js      → storage.js, helpers.js
            ├── stats.js      → storage.js, helpers.js, timer.js
            ├── notifications.js
            └── ui.js         → helpers.js, timer.js
```

`app.js` is the only file that knows about all other modules. No layer imports from a layer above it.

---

## Key Concepts

### Timer state machine (`timer.js`)

The timer owns all state. External code never touches `setInterval` directly — it calls `startTimer()`, `pauseTimer()`, `resetTimer()` and subscribes to events via `onTimer()`.

```
IDLE → RUNNING → PAUSED → RUNNING → DONE → IDLE
```

On every tick, the timer calls registered callbacks — `app.js` receives the state and passes it to `ui.js` for rendering. One-way data flow.

### Persistent timer

On every tick, the timer saves its state to `localStorage` including a `savedAt` timestamp. On page load, `restoreTimerState()` calculates how many seconds passed while the tab was closed and subtracts them from `remaining` before resuming.

### Storage as a repository

`storage.js` is the only module that touches `localStorage`. Every read goes through `safeParse()` to handle corrupted data gracefully. Settings use a spread merge so new keys always fall back to defaults — forward-compatible across versions.

### Stats with `reduce()`

Session history is stored as a flat array. `getTodayStats()` and `getWeeklyStats()` aggregate on read using `Array.reduce()` — no separate aggregated state to keep in sync.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start / Pause timer |
| `N` | Focus task input |
| `R` | Reset timer |

Shortcuts are suppressed when focus is inside an input field.

---

## Getting Started

No install. No build step.

```bash
git clone https://github.com/yourusername/focusguard-js.git
cd focusguard-js
```

Open in VS Code and use **Live Server** (`Right-click index.html → Open with Live Server`).

Or serve with Python:

```bash
python -m http.server 8000
# → http://localhost:8000
```

> **Note:** ES6 modules require a local server. Opening `index.html` directly as a `file://` URL will fail with a CORS error.

---

## What I Learned


- `setInterval` / `clearInterval` — timer state management and the interval ID pattern
- `Notification API` — browser permission flow (`default` → `granted` → `denied`)
- `Date` arithmetic — elapsed time correction on page restore, streak calculation
- `Array.reduce()` — aggregating session history into daily and weekly stats
- ES6 module graph — how a broken import aborts the entire graph
- Observer pattern — callbacks as an alternative to streams/BLoC in JS


---

## License

MIT