// ══════════════════════════════════════════════════════════
//  BlockTab — Options Dashboard Script
// ══════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  USAGE: 'bt_usage',
  LIMITS: 'bt_limits',
  SETTINGS: 'bt_settings',
  WHITELIST: 'bt_whitelist',
  BLOCKED_GROUP: 'bt_blocked_group',
};

const DEFAULT_LIMITS = {
  'youtube.com': 3600, 'twitter.com': 1800, 'x.com': 1800,
  'reddit.com': 1800, 'instagram.com': 1800, 'tiktok.com': 1200, 'facebook.com': 1800,
};

const DEFAULT_WHITELIST = [
  'google.com', 'stackoverflow.com', 'github.com',
  'docs.google.com', 'mail.google.com', 'notion.so', 'figma.com',
];

function formatTime(sec) {
  if (!sec || sec < 0) return '0s';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (h === 0 && s > 0) parts.push(`${s}s`);
  return parts.join(' ') || '0s';
}

function formatLimitTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatDate(dateStr) {
  const [y, mo, d] = dateStr.split('-');
  const date = new Date(+y, +mo - 1, +d);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  const isToday = date.toDateString() === today.toDateString();
  const isYest = date.toDateString() === yesterday.toDateString();
  const label = isToday ? 'Today' : isYest ? 'Yesterday' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return label;
}

// ── Tab switching ──
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((tc) => tc.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
  });
});

// ══════════════════════════════════════
//  Limits Tab
// ══════════════════════════════════════

const limitsContainer = document.getElementById('limitsContainer');
const newDomainInput = document.getElementById('newDomain');
const newHoursInput = document.getElementById('newHours');
const newMinutesInput = document.getElementById('newMinutes');
const addLimitBtn = document.getElementById('addLimitBtn');

async function loadLimits() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.LIMITS);
  const limits = r[STORAGE_KEYS.LIMITS] || { ...DEFAULT_LIMITS };
  limitsContainer.innerHTML = '';
  const entries = Object.entries(limits).sort((a, b) => a[0].localeCompare(b[0]));
  if (entries.length === 0) {
    limitsContainer.innerHTML = '<p class="empty-msg">No limits set. Add one below.</p>';
    return;
  }
  for (const [domain, seconds] of entries) {
    const div = document.createElement('div');
    div.className = 'limit-item';
    div.innerHTML = `
      <div class="limit-domain">
        <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" alt="">
        <span>${domain}</span>
      </div>
      <div class="limit-right">
        <span class="limit-time">${formatLimitTime(seconds)}</span>
        <button class="limit-delete" data-domain="${domain}">✕</button>
      </div>
    `;
    limitsContainer.appendChild(div);
  }
  limitsContainer.querySelectorAll('.limit-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const domain = btn.dataset.domain;
      const r = await chrome.storage.local.get(STORAGE_KEYS.LIMITS);
      const limits = r[STORAGE_KEYS.LIMITS] || {};
      delete limits[domain];
      await chrome.storage.local.set({ [STORAGE_KEYS.LIMITS]: limits });
      loadLimits();
    });
  });
}

addLimitBtn.addEventListener('click', async () => {
  const domain = newDomainInput.value.trim().toLowerCase().replace(/^www\./, '');
  const hours = parseInt(newHoursInput.value) || 0;
  const minutes = parseInt(newMinutesInput.value) || 0;
  const totalSeconds = hours * 3600 + minutes * 60;
  if (!domain || totalSeconds <= 0) return;
  const r = await chrome.storage.local.get(STORAGE_KEYS.LIMITS);
  const limits = r[STORAGE_KEYS.LIMITS] || {};
  limits[domain] = totalSeconds;
  await chrome.storage.local.set({ [STORAGE_KEYS.LIMITS]: limits });
  newDomainInput.value = ''; newHoursInput.value = ''; newMinutesInput.value = '';
  loadLimits();
});

// ══════════════════════════════════════
//  Blocked Group Tab
// ══════════════════════════════════════

const blockedGroupContainer = document.getElementById('blockedGroupContainer');
const newBlockedInput = document.getElementById('newBlockedDomain');
const addBlockedBtn = document.getElementById('addBlockedBtn');

async function loadBlockedGroup() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.BLOCKED_GROUP);
  const list = r[STORAGE_KEYS.BLOCKED_GROUP] || [];
  blockedGroupContainer.innerHTML = '';

  if (list.length === 0) {
    blockedGroupContainer.innerHTML = '<p class="empty-msg">No sites permanently blocked. Add one below.</p>';
    return;
  }

  for (const domain of list.sort()) {
    const div = document.createElement('div');
    div.className = 'limit-item blocked-item';
    div.innerHTML = `
      <div class="limit-domain">
        <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" alt="">
        <span>${domain}</span>
      </div>
      <div class="limit-right">
        <span class="blocked-badge">Permanently Blocked</span>
        <button class="limit-delete" data-domain="${domain}">Unblock</button>
      </div>
    `;
    blockedGroupContainer.appendChild(div);
  }

  blockedGroupContainer.querySelectorAll('.limit-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const domain = btn.dataset.domain;
      const r = await chrome.storage.local.get(STORAGE_KEYS.BLOCKED_GROUP);
      let list = r[STORAGE_KEYS.BLOCKED_GROUP] || [];
      list = list.filter((d) => d !== domain);
      await chrome.storage.local.set({ [STORAGE_KEYS.BLOCKED_GROUP]: list });
      loadBlockedGroup();
    });
  });
}

addBlockedBtn.addEventListener('click', async () => {
  const domain = newBlockedInput.value.trim().toLowerCase().replace(/^www\./, '');
  if (!domain) return;
  const r = await chrome.storage.local.get(STORAGE_KEYS.BLOCKED_GROUP);
  const list = r[STORAGE_KEYS.BLOCKED_GROUP] || [];
  if (!list.includes(domain)) {
    list.push(domain);
    await chrome.storage.local.set({ [STORAGE_KEYS.BLOCKED_GROUP]: list });
  }
  newBlockedInput.value = '';
  loadBlockedGroup();
});

// ══════════════════════════════════════
//  YouTube Tab
// ══════════════════════════════════════

const youtubeToggles = ['hideShorts', 'hideComments', 'hideRecommendations', 'disableAutoplay'];

async function loadYouTubeSettings() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  const settings = r[STORAGE_KEYS.SETTINGS] || {};
  const yt = settings.youtube || {};
  for (const key of youtubeToggles) {
    document.getElementById(key).checked = !!yt[key];
  }
}

for (const key of youtubeToggles) {
  document.getElementById(key).addEventListener('change', async (e) => {
    const r = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    const settings = r[STORAGE_KEYS.SETTINGS] || {};
    if (!settings.youtube) settings.youtube = {};
    settings.youtube[key] = e.target.checked;
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
  });
}

// ══════════════════════════════════════
//  Whitelist Tab
// ══════════════════════════════════════

const whitelistContainer = document.getElementById('whitelistContainer');
const newWhitelistInput = document.getElementById('newWhitelistDomain');
const addWhitelistBtn = document.getElementById('addWhitelistBtn');

async function loadWhitelist() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.WHITELIST);
  const whitelist = r[STORAGE_KEYS.WHITELIST] || [...DEFAULT_WHITELIST];
  whitelistContainer.innerHTML = '';
  if (whitelist.length === 0) {
    whitelistContainer.innerHTML = '<p class="empty-msg">No whitelisted sites.</p>';
    return;
  }
  for (const domain of whitelist.sort()) {
    const div = document.createElement('div');
    div.className = 'limit-item';
    div.innerHTML = `
      <div class="limit-domain">
        <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" alt="">
        <span>${domain}</span>
      </div>
      <div class="limit-right">
        <span class="limit-time" style="color:#4ade80">Allowed</span>
        <button class="limit-delete" data-domain="${domain}">✕</button>
      </div>
    `;
    whitelistContainer.appendChild(div);
  }
  whitelistContainer.querySelectorAll('.limit-delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const domain = btn.dataset.domain;
      const r = await chrome.storage.local.get(STORAGE_KEYS.WHITELIST);
      let whitelist = r[STORAGE_KEYS.WHITELIST] || [...DEFAULT_WHITELIST];
      whitelist = whitelist.filter((d) => d !== domain);
      await chrome.storage.local.set({ [STORAGE_KEYS.WHITELIST]: whitelist });
      loadWhitelist();
    });
  });
}

addWhitelistBtn.addEventListener('click', async () => {
  const domain = newWhitelistInput.value.trim().toLowerCase().replace(/^www\./, '');
  if (!domain) return;
  const r = await chrome.storage.local.get(STORAGE_KEYS.WHITELIST);
  const whitelist = r[STORAGE_KEYS.WHITELIST] || [...DEFAULT_WHITELIST];
  if (!whitelist.includes(domain)) {
    whitelist.push(domain);
    await chrome.storage.local.set({ [STORAGE_KEYS.WHITELIST]: whitelist });
  }
  newWhitelistInput.value = '';
  loadWhitelist();
});

// ══════════════════════════════════════
//  Data Tab — improved day-wise UI
// ══════════════════════════════════════

const usageHistoryEl = document.getElementById('usageHistory');

async function loadUsageHistory() {
  const [usageResult, limitsResult] = await Promise.all([
    chrome.storage.local.get(STORAGE_KEYS.USAGE),
    chrome.storage.local.get(STORAGE_KEYS.LIMITS),
  ]);
  const all = usageResult[STORAGE_KEYS.USAGE] || {};
  const limits = limitsResult[STORAGE_KEYS.LIMITS] || {};

  usageHistoryEl.innerHTML = '';
  const days = Object.entries(all).sort((a, b) => b[0].localeCompare(a[0]));

  if (days.length === 0) {
    usageHistoryEl.innerHTML = '<p class="empty-msg" style="padding:24px 0">No usage data recorded yet.</p>';
    return;
  }

  for (const [date, domains] of days.slice(0, 14)) {
    const sorted = Object.entries(domains).sort((a, b) => b[1] - a[1]);
    const totalDay = sorted.reduce((sum, [, s]) => sum + s, 0);
    const maxSec = sorted[0]?.[1] || 1;

    const dayEl = document.createElement('div');
    dayEl.className = 'usage-day-card';

    const sites = sorted.map(([domain, seconds]) => {
      const limitSec = limits[domain];
      const overLimit = limitSec && seconds >= limitSec;
      return `
        <div class="uday-row">
          <div class="uday-left">
            <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" class="uday-favicon" alt="">
            <span class="uday-domain">${domain}</span>
          </div>
          <span class="uday-time ${overLimit ? 'over-limit' : ''}">${formatTime(seconds)}</span>
        </div>
      `;
    }).join('');

    dayEl.innerHTML = `
      <div class="uday-header">
        <div class="uday-title">
          <span class="uday-date">${formatDate(date)}</span>
          <span class="uday-date-sub">${date}</span>
        </div>
        <span class="uday-total">${formatTime(totalDay)}</span>
      </div>
      <div class="uday-sites">${sites}</div>
    `;
    usageHistoryEl.appendChild(dayEl);
  }
}

// Export
document.getElementById('exportBtn').addEventListener('click', async () => {
  const data = await chrome.storage.local.get(null);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `blocktab-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());

document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    await chrome.storage.local.set(data);
    loadLimits(); loadBlockedGroup(); loadWhitelist(); loadYouTubeSettings(); loadUsageHistory();
    alert('Data imported successfully!');
  } catch { alert('Failed to import — invalid JSON file.'); }
});

document.getElementById('clearBtn').addEventListener('click', async () => {
  if (confirm('This will delete ALL BlockTab data. Are you sure?')) {
    await chrome.storage.local.clear();
    loadLimits(); loadBlockedGroup(); loadWhitelist(); loadYouTubeSettings(); loadUsageHistory();
  }
});

// ── Init ──
loadLimits();
loadBlockedGroup();
loadWhitelist();
loadYouTubeSettings();
loadUsageHistory();
