// ══════════════════════════════════════════════════════════
//  BlockTab — Utils (constants, domain, time, date helpers)
// ══════════════════════════════════════════════════════════

// ── Storage Keys ──
export const STORAGE_KEYS = {
  USAGE: 'bt_usage',
  LIMITS: 'bt_limits',
  SETTINGS: 'bt_settings',
  STRICT: 'bt_strict',
  FOCUS: 'bt_focus',
  WRITING_UNLOCKS: 'bt_writing_unlocks',
  WHITELIST: 'bt_whitelist',
  BLOCKED_GROUP: 'bt_blocked_group',
};

// ── Alarm Names ──
export const ALARMS = {
  USAGE_CHECK: 'bt_usage_check',
  MIDNIGHT_RESET: 'bt_midnight',
};

// ── Default Limits (seconds) ──
export const DEFAULT_LIMITS = {
  'youtube.com': 3600,
  'twitter.com': 1800,
  'x.com': 1800,
  'reddit.com': 1800,
  'instagram.com': 1800,
  'tiktok.com': 1200,
  'facebook.com': 1800,
};

// ── Default Settings ──
export const DEFAULT_SETTINGS = {
  youtube: {
    hideShorts: false,
    hideComments: false,
    hideRecommendations: false,
    disableAutoplay: false,
  },
  notifications: true,
};

// ── Strict Mode Whitelist ──
export const STRICT_WHITELIST = [
  'google.com',
  'stackoverflow.com',
  'github.com',
  'docs.google.com',
  'mail.google.com',
  'notion.so',
  'figma.com',
];

// ── Writing Challenge Config ──
export const WRITING_UNLOCK_MINUTES = 5;
export const WRITING_MIN_CHARS = 200;

// ── Page URL Helpers ──
export function getBlockedPageURL(domain = '') {
  const base = chrome.runtime.getURL('pages/blocked.html');
  return domain ? `${base}?domain=${encodeURIComponent(domain)}` : base;
}

export function getStrictPageURL() {
  return chrome.runtime.getURL('pages/strict.html');
}

export function getWritingPageURL(domain = '') {
  const base = chrome.runtime.getURL('pages/writing.html');
  return domain ? `${base}?domain=${encodeURIComponent(domain)}` : base;
}

// ── Domain Extraction ──
export function getDomain(urlString) {
  try {
    const url = new URL(urlString);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

// ── Time Formatting ──
export function formatTime(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return '0s';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (h === 0 && s > 0) parts.push(`${s}s`);
  return parts.join(' ') || '0s';
}

export function formatTimeClock(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return '00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(Math.floor(totalSeconds % 60)).padStart(2, '0');
  return h > 0 ? `${String(h).padStart(2, '0')}:${m}:${s}` : `${m}:${s}`;
}

export function usagePercent(used, limit) {
  if (!limit) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

// ── Date Helpers ──
export function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function minutesUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return (midnight.getTime() - now.getTime()) / 60000;
}
