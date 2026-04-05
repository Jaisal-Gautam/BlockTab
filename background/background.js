// ══════════════════════════════════════════════════════════
//  BlockTab — Background Service Worker
//  Single entry point for all background logic:
//    • Time tracking (active tab detection, timestamp-based)
//    • Blocking (limit enforcement, redirect)
//    • Strict mode (whitelist enforcement)
//    • Alarms (periodic checks, midnight reset)
// ══════════════════════════════════════════════════════════

import {
  ALARMS,
  DEFAULT_LIMITS,
  getDomain,
  getBlockedPageURL,
  getStrictPageURL,
  STRICT_WHITELIST,
  minutesUntilMidnight,
} from '../utils/helpers.js';

import {
  incrementUsage,
  getDomainUsage,
  resetTodayUsage,
  getLimits,
  checkLimit,
  setAllLimits,
  isStrictModeActive,
  getFocusMode,
  isWritingUnlocked,
  getWhitelist,
  isDomainPermanentlyBlocked,
  isBlockedGroupUnlocked,
  hasUsedBlockedGroupUnlockToday,
} from '../store/store.js';

// ──────────────────────────────────────
//  State (timestamp-based tracking)
//  Instead of setInterval (which dies when service worker
//  suspends), we record WHEN tracking started and flush
//  the elapsed time on every tab/window change and via alarm.
// ──────────────────────────────────────
let activeTabId = null;
let activeDomain = null;
let trackingStartTime = null; // Date.now() when we started tracking this domain
let isSystemIdle = false;

// ──────────────────────────────────────
//  Time Tracker (timestamp-based)
// ──────────────────────────────────────

/** Flush accumulated time for the current domain into storage. */
async function flushTime() {
  if (activeDomain && trackingStartTime) {
    const elapsed = Math.floor((Date.now() - trackingStartTime) / 1000);
    if (elapsed > 0) {
      await incrementUsage(activeDomain, elapsed);
    }
    trackingStartTime = Date.now(); // reset start for next interval
  }
}

function updateActiveTab(tab) {
  if (isSystemIdle) return; // Do not start tracking if system is idle/locked

  const domain = tab.url ? getDomain(tab.url) : null;
  if (!domain || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    // Flush any pending time, then stop
    flushTime();
    activeDomain = null;
    activeTabId = null;
    trackingStartTime = null;
    return;
  }

  if (domain !== activeDomain) {
    // Domain changed — flush old domain's time first
    flushTime();
  }

  activeTabId = tab.id;
  activeDomain = domain;
  trackingStartTime = Date.now();
}

async function syncCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) updateActiveTab(tab);
  } catch { /* no active tab */ }
}

// ── Tab listeners ──

chrome.tabs.onActivated.addListener(async (info) => {
  try {
    const tab = await chrome.tabs.get(info.tabId);
    updateActiveTab(tab);
  } catch {
    flushTime();
    activeDomain = null;
    activeTabId = null;
    trackingStartTime = null;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changes, tab) => {
  if (tabId === activeTabId && changes.url) {
    updateActiveTab(tab);
  }
  // Also run blocker/strict checks on every navigation
  if (changes.status === 'loading' && tab.url) {
    checkAndBlock(tabId, tab.url);
    checkStrict(tabId, tab.url);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await flushTime();
    activeDomain = null;
    activeTabId = null;
    trackingStartTime = null;
  } else {
    try {
      const [tab] = await chrome.tabs.query({ active: true, windowId });
      if (tab) updateActiveTab(tab);
    } catch {
      flushTime();
      activeDomain = null;
      activeTabId = null;
      trackingStartTime = null;
    }
  }
});

chrome.idle.onStateChanged.addListener(async (newState) => {
  if (newState === 'locked' || newState === 'idle') {
    isSystemIdle = true;
    await flushTime();
    activeDomain = null;
    activeTabId = null;
    trackingStartTime = null;
  } else if (newState === 'active') {
    isSystemIdle = false;
    await syncCurrentTab();
  }
});

// ──────────────────────────────────────
//  Blocker
// ──────────────────────────────────────

async function checkAndBlock(tabId, url) {
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return;
  // Don't intercept our own pages
  if (url.startsWith(chrome.runtime.getURL(''))) return;
  const domain = getDomain(url);
  if (!domain) return;

  // 1. Permanently blocked group
  const permBlocked = await isDomainPermanentlyBlocked(domain);
  if (permBlocked) {
    // Check if the 5-min writing-unlock window is currently active
    const bgUnlocked = await isBlockedGroupUnlocked(domain);
    if (bgUnlocked) return; // still within 5-min window — allow

    // Check if they already used their one unlock today
    const usedToday = await hasUsedBlockedGroupUnlockToday(domain);
    if (usedToday) {
      // Window expired AND already used — hard block, no challenge
      try { chrome.tabs.update(tabId, { url: getBlockedPageURL(domain) }); } catch {}
    } else {
      // First attempt today — send to writing challenge with fromBlocked flag
      const base = chrome.runtime.getURL('pages/writing.html');
      try { chrome.tabs.update(tabId, { url: `${base}?domain=${encodeURIComponent(domain)}&fromBlocked=1` }); } catch {}
    }
    return;
  }

  // 2. Writing unlock overrides time limit
  const unlocked = await isWritingUnlocked(domain);
  if (unlocked) return;

  // 3. Time limit check
  const used = await getDomainUsage(domain);
  const result = await checkLimit(domain, used);
  if (result.exceeded) {
    try { chrome.tabs.update(tabId, { url: getBlockedPageURL(domain) }); } catch {}
  }
}

async function enforceActiveTab() {
  // Flush time first so we have the latest usage
  await flushTime();

  if (!activeDomain || !activeTabId) return;

  const unlocked = await isWritingUnlocked(activeDomain);
  if (unlocked) return;

  const used = await getDomainUsage(activeDomain);
  const result = await checkLimit(activeDomain, used);
  if (result.exceeded) {
    try { chrome.tabs.update(activeTabId, { url: getBlockedPageURL(activeDomain) }); } catch {}
  }
}

async function enforceAllTabs() {
  const limits = await getLimits();
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;
    const domain = getDomain(tab.url);
    if (!domain || !limits[domain]) continue;

    const unlocked = await isWritingUnlocked(domain);
    if (unlocked) continue;

    const used = await getDomainUsage(domain);
    if (used >= limits[domain]) {
      try { chrome.tabs.update(tab.id, { url: getBlockedPageURL(domain) }); } catch {}
    }
  }
}

// ──────────────────────────────────────
//  Strict Mode Enforcement
// ──────────────────────────────────────

async function checkStrict(tabId, url) {
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return;
  const isActive = await isStrictModeActive();
  if (!isActive) return;

  const domain = getDomain(url);
  if (!domain) return;

  const whitelist = await getWhitelist();
  const whitelisted = whitelist.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`)
  );
  if (!whitelisted) {
    try { chrome.tabs.update(tabId, { url: getStrictPageURL() }); } catch {}
  }
}

async function enforceStrictAllTabs() {
  const isActive = await isStrictModeActive();
  if (!isActive) return;

  const whitelist = await getWhitelist();
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;
    const domain = getDomain(tab.url);
    if (!domain) continue;

    const whitelisted = whitelist.some(
      (allowed) => domain === allowed || domain.endsWith(`.${allowed}`)
    );
    if (!whitelisted) {
      try { chrome.tabs.update(tab.id, { url: getStrictPageURL() }); } catch {}
    }
  }
}

// ──────────────────────────────────────
//  Alarms
// ──────────────────────────────────────

function setupAlarms() {
  // Flush time + check usage every 30 seconds (more reliable than setInterval)
  chrome.alarms.create(ALARMS.USAGE_CHECK, { periodInMinutes: 0.5 });
  // Midnight reset
  chrome.alarms.create(ALARMS.MIDNIGHT_RESET, {
    delayInMinutes: minutesUntilMidnight(),
    periodInMinutes: 1440,
  });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARMS.USAGE_CHECK) {
    // Flush accumulated time and re-sync the active tab
    await flushTime();
    await syncCurrentTab();
    await enforceActiveTab();
    await enforceStrictAllTabs();
  } else if (alarm.name === ALARMS.MIDNIGHT_RESET) {
    await resetTodayUsage();
    chrome.alarms.create(ALARMS.MIDNIGHT_RESET, {
      delayInMinutes: minutesUntilMidnight(),
      periodInMinutes: 1440,
    });
  }
});

// ──────────────────────────────────────
//  Lifecycle
// ──────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  // Seed default limits on first install
  const r = await chrome.storage.local.get('bt_limits');
  if (!r.bt_limits) {
    await setAllLimits({ ...DEFAULT_LIMITS });
  }
  setupAlarms();
  syncCurrentTab();
});

chrome.runtime.onStartup.addListener(() => {
  setupAlarms();
  syncCurrentTab();
});

// MV3 service workers can restart at any time — always init
setupAlarms();
syncCurrentTab();

// ──────────────────────────────────────
//  Message Handler (for popup / options)
// ──────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_ACTIVE_DOMAIN') {
    sendResponse({ domain: activeDomain });
    return false;
  }
  if (msg.type === 'ENFORCE_NOW') {
    enforceAllTabs().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === 'ENFORCE_STRICT') {
    enforceStrictAllTabs().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === 'FLUSH_TIME') {
    flushTime().then(() => sendResponse({ ok: true }));
    return true;
  }
});
