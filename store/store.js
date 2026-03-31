// ══════════════════════════════════════════════════════════
//  BlockTab — Store (all chrome.storage.local operations)
// ══════════════════════════════════════════════════════════

import {
  STORAGE_KEYS,
  DEFAULT_LIMITS,
  DEFAULT_SETTINGS,
  STRICT_WHITELIST,
  getTodayKey,
} from '../utils/helpers.js';

// ──────────────────────────────────────
//  Usage Store
// ──────────────────────────────────────

export async function getAllUsage() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.USAGE);
  return r[STORAGE_KEYS.USAGE] || {};
}

export async function getTodayUsage() {
  const all = await getAllUsage();
  return all[getTodayKey()] || {};
}

export async function getDomainUsage(domain) {
  const today = await getTodayUsage();
  return today[domain] || 0;
}

export async function incrementUsage(domain, seconds = 1) {
  const all = await getAllUsage();
  const key = getTodayKey();
  if (!all[key]) all[key] = {};
  if (!all[key][domain]) all[key][domain] = 0;
  all[key][domain] += seconds;
  await chrome.storage.local.set({ [STORAGE_KEYS.USAGE]: all });
  return all[key][domain];
}

export async function resetTodayUsage() {
  const all = await getAllUsage();
  all[getTodayKey()] = {};
  await chrome.storage.local.set({ [STORAGE_KEYS.USAGE]: all });
}

export async function clearAllUsage() {
  await chrome.storage.local.remove(STORAGE_KEYS.USAGE);
}

export async function exportAllData() {
  const data = await chrome.storage.local.get(null);
  return data;
}

export async function importData(data) {
  await chrome.storage.local.set(data);
}

// ──────────────────────────────────────
//  Limits Store
// ──────────────────────────────────────

export async function getLimits() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.LIMITS);
  return r[STORAGE_KEYS.LIMITS] || { ...DEFAULT_LIMITS };
}

export async function getDomainLimit(domain) {
  const limits = await getLimits();
  return limits[domain] ?? null;
}

export async function setDomainLimit(domain, seconds) {
  const limits = await getLimits();
  limits[domain] = seconds;
  await chrome.storage.local.set({ [STORAGE_KEYS.LIMITS]: limits });
}

export async function removeDomainLimit(domain) {
  const limits = await getLimits();
  delete limits[domain];
  await chrome.storage.local.set({ [STORAGE_KEYS.LIMITS]: limits });
}

export async function setAllLimits(limits) {
  await chrome.storage.local.set({ [STORAGE_KEYS.LIMITS]: limits });
}

export async function checkLimit(domain, usedSeconds) {
  const limit = await getDomainLimit(domain);
  if (limit === null) return { exceeded: false, used: usedSeconds, limit: null, remaining: Infinity };
  return {
    exceeded: usedSeconds >= limit,
    used: usedSeconds,
    limit,
    remaining: Math.max(0, limit - usedSeconds),
  };
}

// ──────────────────────────────────────
//  Settings Store
// ──────────────────────────────────────

export async function getSettings() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  const stored = r[STORAGE_KEYS.SETTINGS] || {};
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    youtube: { ...DEFAULT_SETTINGS.youtube, ...(stored.youtube || {}) },
  };
}

export async function updateSettings(partial) {
  const current = await getSettings();
  const updated = { ...current, ...partial };
  if (partial.youtube) {
    updated.youtube = { ...current.youtube, ...partial.youtube };
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
  return updated;
}

export async function getYouTubeSettings() {
  const s = await getSettings();
  return s.youtube;
}

export async function updateYouTubeSettings(partial) {
  const settings = await getSettings();
  settings.youtube = { ...settings.youtube, ...partial };
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
  return settings.youtube;
}

// ──────────────────────────────────────
//  Focus Mode
// ──────────────────────────────────────

export async function getFocusMode() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.FOCUS);
  return r[STORAGE_KEYS.FOCUS] || { active: false, endTime: null };
}

export async function setFocusMode(active, durationMinutes = 0) {
  const endTime = active ? Date.now() + durationMinutes * 60000 : null;
  const data = { active, endTime };
  await chrome.storage.local.set({ [STORAGE_KEYS.FOCUS]: data });
  return data;
}

// ──────────────────────────────────────
//  Strict Mode Store
// ──────────────────────────────────────

export async function getStrictMode() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.STRICT);
  return r[STORAGE_KEYS.STRICT] || { active: false, endTime: null };
}

export async function enableStrictMode(durationMinutes) {
  const data = { active: true, endTime: Date.now() + durationMinutes * 60000 };
  await chrome.storage.local.set({ [STORAGE_KEYS.STRICT]: data });
  return data;
}

export async function disableStrictMode() {
  const data = { active: false, endTime: null };
  await chrome.storage.local.set({ [STORAGE_KEYS.STRICT]: data });
  return data;
}

export async function isStrictModeActive() {
  const state = await getStrictMode();
  if (!state.active) return false;
  if (state.endTime && Date.now() > state.endTime) {
    await disableStrictMode();
    return false;
  }
  return true;
}

export async function getStrictTimeRemaining() {
  const state = await getStrictMode();
  if (!state.active || !state.endTime) return 0;
  return Math.max(0, Math.floor((state.endTime - Date.now()) / 1000));
}

// ──────────────────────────────────────
//  Writing Unlocks
// ──────────────────────────────────────

export async function getWritingUnlocks() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.WRITING_UNLOCKS);
  return r[STORAGE_KEYS.WRITING_UNLOCKS] || {};
}

export async function setWritingUnlock(domain, unlockUntil) {
  const unlocks = await getWritingUnlocks();
  unlocks[domain] = unlockUntil;
  await chrome.storage.local.set({ [STORAGE_KEYS.WRITING_UNLOCKS]: unlocks });
}

export async function isWritingUnlocked(domain) {
  const unlocks = await getWritingUnlocks();
  if (!unlocks[domain]) return false;
  if (Date.now() > unlocks[domain]) {
    delete unlocks[domain];
    await chrome.storage.local.set({ [STORAGE_KEYS.WRITING_UNLOCKS]: unlocks });
    return false;
  }
  return true;
}

// ──────────────────────────────────────
//  Whitelist
// ──────────────────────────────────────

export async function getWhitelist() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.WHITELIST);
  return r[STORAGE_KEYS.WHITELIST] || [...STRICT_WHITELIST];
}

export async function setWhitelist(list) {
  await chrome.storage.local.set({ [STORAGE_KEYS.WHITELIST]: list });
}

// ──────────────────────────────────────
//  Blocked Group (permanently blocked sites)
// ──────────────────────────────────────

export async function getBlockedGroup() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.BLOCKED_GROUP);
  return r[STORAGE_KEYS.BLOCKED_GROUP] || [];
}

export async function addToBlockedGroup(domain) {
  const list = await getBlockedGroup();
  if (!list.includes(domain)) {
    list.push(domain);
    await chrome.storage.local.set({ [STORAGE_KEYS.BLOCKED_GROUP]: list });
  }
  return list;
}

export async function removeFromBlockedGroup(domain) {
  let list = await getBlockedGroup();
  list = list.filter((d) => d !== domain);
  await chrome.storage.local.set({ [STORAGE_KEYS.BLOCKED_GROUP]: list });
  return list;
}

export async function isDomainPermanentlyBlocked(domain) {
  const list = await getBlockedGroup();
  return list.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`));
}

// ──────────────────────────────────────
//  Blocked Group — Daily Writing Unlock
//  A permanently blocked domain can be unlocked via the
//  writing challenge once per day for 5 minutes.
//  After that, it re-blocks and cannot be unlocked again today.
// ──────────────────────────────────────

const BG_UNLOCKS_KEY = 'bt_bg_unlocks'; // { domain: { date, unlockUntil } }

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export async function getBlockedGroupUnlocks() {
  const r = await chrome.storage.local.get(BG_UNLOCKS_KEY);
  return r[BG_UNLOCKS_KEY] || {};
}

/** Returns true only if unlock is active right now (within 5-min window, same day) */
export async function isBlockedGroupUnlocked(domain) {
  const unlocks = await getBlockedGroupUnlocks();
  const entry = unlocks[domain];
  if (!entry) return false;
  if (entry.date !== todayStr()) return false;           // different day — expired
  if (Date.now() > entry.unlockUntil) return false;     // window closed
  return true;
}

/** Returns true if they already used their one unlock for today (even if 5 min elapsed) */
export async function hasUsedBlockedGroupUnlockToday(domain) {
  const unlocks = await getBlockedGroupUnlocks();
  const entry = unlocks[domain];
  if (!entry) return false;
  return entry.date === todayStr();
}

/** Record a 5-minute unlock for a permanently blocked domain */
export async function setBlockedGroupUnlock(domain, minutes = 5) {
  const unlocks = await getBlockedGroupUnlocks();
  unlocks[domain] = {
    date: todayStr(),
    unlockUntil: Date.now() + minutes * 60 * 1000,
  };
  await chrome.storage.local.set({ [BG_UNLOCKS_KEY]: unlocks });
}
