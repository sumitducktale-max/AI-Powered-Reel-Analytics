<<<<<<< HEAD
# Instagram Reel Scraper & Analytics Monorepo

A premium, full-stack application split into organized `backend/` and `frontend/` directories to scrape, analyze, and display Instagram Reel metadata in a gorgeous glassmorphic dashboard. Powered by a robust, multi-stage bypass strategy utilizing stealth Playwright browser automation, internal network response interception, and nodemon hot-reloading.

---

## 🌟 6-Layer Anti-Bot & Bypass Strategy

To circumvent Instagram's aggressive login walls and scraping blockades, this system implements six layers of evasion:

1. **Stealth Browser (Layer 1):** Utilizes `playwright-extra` coupled with `puppeteer-extra-plugin-stealth` to systematically patch automated webdriver indicators (`navigator.webdriver`), custom WebGL hashes, plugin lists, and hardware configurations.
2. **Session Injection (Layer 2):** Supports dynamic, file-based cookie injection (`cookies.json`). The browser context injects authenticated session states prior to navigation, bypassing login blocks entirely.
3. **Human Simulation (Layer 3):** Simulates random human browsing patterns. It randomizes screen viewports, user-agent headers, injects mouse cursor jitter, and executes realistic organic scrolling.
4. **Network Interception (Layer 4 - Primary):** Avoids unstable DOM selector scraping by registering response listeners that intercept internal GraphQL (`/graphql/query`) and REST (`api/v1/media`) endpoints, extracting native JSON payloads.
5. **Proxy Rotation (Layer 5):** Ready-to-scale proxy configuration layer (`PROXY_URL`) supporting basic-auth formats (`http://user:pass@host:port`).
6. **oEmbed Fallback (Layer 6 - Resiliency):** Provides a final fallback utilizing the official Instagram/Meta oEmbed endpoints if Playwright is blocked or experiences a browser failure.

---

## 🚀 Key Feature: Self-Healing Browser Launcher

In enterprise or sandbox network environments where custom Playwright browser downloads (`cdn.playwright.dev`) might fail or get blocked by firewall policies (e.g. throwing `ECONNRESET`), the browser launcher implements an **automatic fallback chain**:
- **Attempt 1:** Standard Playwright Chromium binary.
- **Attempt 2:** Checks and launches the locally installed system **Google Chrome** (`channel: 'chrome'`).
- **Attempt 3:** Checks and launches the locally installed system **Microsoft Edge** (`channel: 'msedge'`).

This self-healing launcher ensures that the browser automation layer **works perfectly out of the box** without requiring binary downloads!

---

## 📂 Coordinated Directory Structure

The repository is structured into a clean monorepo division to segregate core logic:

```text
d:\InstaReel/
├── backend/                  # Clean Express Backend Subfolder
│   ├── src/
│   │   ├── config/
│   │   │   └── proxy.js      # Proxy credentials loader
│   │   ├── middleware/
│   │   │   └── validator.js  # URL validation & normalization (GET/POST)
│   │   ├── controllers/
│   │   │   └── reelController.js # Flow orchestrator (Stealth -> DOM -> oEmbed)
│   │   ├── routes/
│   │   │   └── reelRoutes.js # Express routing layer
│   │   ├── services/
│   │   │   ├── browser.js    # Playwright stealth launcher & system fallbacks
│   │   │   ├── interceptor.js# Network GraphQL/REST interceptor
│   │   │   ├── scraper.js    # DOM/JSON-LD backup selector
│   │   │   └── oembed.js     # Meta oEmbed client fallback
│   │   ├── utils/
│   │   │   └── helpers.js    # Sleep, scroll, and mouse jitter functions
│   │   └── app.js            # Express API server entrypoint
│   ├── scripts/
│   │   └── auth-setup.js     # manual interactive session cookie creator
│   ├── package.json          # nodemon, Express, and Playwright dependencies
│   └── .env & .env.example   # Environment isolation configs
├── frontend/                 # Clean React Frontend Subfolder
│   ├── src/
│   │   ├── components/
│   │   │   ├── InputPanel.jsx     # Modern URL search & validation loaders
│   │   │   ├── MetadataCard.jsx   # Metrics dashboard console (Likes, Comments, Audio)
│   │   │   └── VideoPreview.jsx   # Video player or thumbnail covers
│   │   ├── index.css              # Custom styling system (HSL, glass panels)
│   │   ├── App.jsx                # Layout & state manager
│   │   └── main.jsx               # React bootstrap
│   ├── vite.config.js             # Vite reverse proxy config (/api -> localhost:5000)
│   └── package.json               # React, Vite, and Lucide dependencies
├── scripts/
│   └── dev.js                # Custom root concurrency dev launcher
├── package.json              # Root monorepo coordinator configuration
└── README.md                 # System user manual
```

---

## ⚡ Setup & Launching the App

### 1. Install Monorepo Dependencies
Run a single command in the monorepo root to install packages across root, backend, and frontend directories:
```bash
npm run install:all
```

### 2. Generate Session Cookies (Highly Recommended)
Instagram heavily blocks public browsing. Build a session cookie profile by running the manual login helper from the root directory:
```bash
npm run auth:setup
```
*A headed browser will open. Log in manually. Once viewing your homepage feed, return to the console and press **`[ENTER]`** to save your `cookies.json` profile.*

### 3. Start Hot-Reload Server & Dashboard
Launch both servers in unison with a single command from the root folder:
```bash
npm run dev
```
- **Express Backend (Under Nodemon reloads):** Running on `http://localhost:5000`
- **React Frontend (Under Vite reloads):** Running on `http://localhost:5173`

---

## 📡 REST API Documentation

### 1. Scrape via POST
- **Endpoint:** `POST /api/reel/analyze`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "url": "https://www.instagram.com/reel/C7rZ-SjP1F2/"
}
```

### 2. Scrape via GET
- **Endpoint:** `GET /api/scrape?url=https://www.instagram.com/reel/C7rZ-SjP1F2/`

---

### 📦 Sample Structured Response
```json
{
  "success": true,
  "data": {
    "username": "codewithharry",
    "caption": "Creating microservices using Node.js and Express has never been easier! Check out these 5 essential npm libraries. #coding #javascript #programming",
    "likes": "18392",
    "comments": "482",
    "thumbnail": "https://scontent-iad3-2.cdninstagram.com/v/t51.29350-15/...",
    "videoUrl": "https://instagram.fapa1-1.fna.fbcdn.net/v/t50.2886-16/...",
    "audioName": "Original Audio",
    "timestamp": "2026-05-20T14:32:00.000Z",
    "platform": "Instagram",
    "metadata_source": "Network Interception (GraphQL)"
  }
}
```
=======
# AI-Powered-Reel-Analytics
Conduct high-precision multi-stage scraping, embed asset extraction, and advanced Gemini-driven multimodal visual intelligence reports.
>>>>>>> 94d63c9f3bffaeaadf60f74efa2a695c8586cf1d
