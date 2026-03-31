# BlockTab — Chrome Extension

Stay focused. Block distractions. Track your screen time.

## Features

- **Time Tracking** — Automatically tracks time spent on every website
- **Site Blocking** — Set daily time limits; sites get blocked when the limit is reached
- **YouTube Controls** — Hide Shorts, comments, recommendations, disable autoplay
- **Focus Mode** — Timed focus sessions (25m, 50m, 90m, 2hr)
- **Strict Mode** — Blocks ALL non-whitelisted sites for a set duration (cannot cancel early)
- **Writing Challenge** — Write 200+ characters to earn 5 minutes of access to a blocked site
- **Data Export/Import** — Backup and restore your settings and usage data

## How to Use (Local Development)

1.  Download the files
2.  Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the `blocktab/` folder
6. Pin the extension to your toolbar 

## Structure

```
blocktab/
├── manifest.json           → Extension manifest (MV3)
├── icons/                  → Extension icons
├── utils/helpers.js        → Constants, domain extraction, time/date formatting
├── store/store.js          → All chrome.storage operations
├── background/background.js → Service worker (tracker, blocker, strict mode, alarms)
├── content/youtube.js      → YouTube DOM manipulation
├── popup/                  → Toolbar popup (usage summary, focus/strict toggles)
├── options/                → Dashboard (limits, YouTube settings, data management)
└── pages/                  → Blocked, strict mode, and writing challenge pages
```

## Usage

| Action | How |
|--------|-----|
| View usage | Click the BlockTab icon in toolbar |
| Set limits | Click ⚙️ in popup → Limits tab |
| YouTube controls | Click ⚙️ in popup → YouTube tab |
| Start focus mode | Click 🔒 Focus Mode in popup |
| Start strict mode | Click ⚡ Strict Mode in popup |
| Export data | Dashboard → Data tab → Export |
