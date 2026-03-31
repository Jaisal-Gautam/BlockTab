// ══════════════════════════════════════════════════════════
//  BlockTab — Popup Script
// ══════════════════════════════════════════════════════════

const STORAGE_KEYS = {
  USAGE: 'bt_usage',
  LIMITS: 'bt_limits',
  SETTINGS: 'bt_settings',
  STRICT: 'bt_strict',
  FOCUS: 'bt_focus',
};

// ── Helpers ──

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

function usagePercent(used, limit) {
  if (!limit) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

// ── DOM References ──
const totalTimeEl = document.getElementById('totalTime');
const summaryBarEl = document.getElementById('summaryBar');
const siteListEl = document.getElementById('siteList');
const settingsBtn = document.getElementById('settingsBtn');
const focusBtn = document.getElementById('focusBtn');
const focusLabel = document.getElementById('focusLabel');
const focusPanel = document.getElementById('focusPanel');
const cancelFocus = document.getElementById('cancelFocus');
const strictBtn = document.getElementById('strictBtn');
const strictPanel = document.getElementById('strictPanel');

// ── Load & Render Usage ──

async function loadUsage() {
  const usageResult = await chrome.storage.local.get(STORAGE_KEYS.USAGE);
  const allUsage = usageResult[STORAGE_KEYS.USAGE] || {};
  const today = allUsage[getTodayKey()] || {};

  const limitsResult = await chrome.storage.local.get(STORAGE_KEYS.LIMITS);
  const limits = limitsResult[STORAGE_KEYS.LIMITS] || {};

  // Total time
  const totalSeconds = Object.values(today).reduce((sum, s) => sum + s, 0);
  totalTimeEl.textContent = formatTime(totalSeconds);

  // Summary bar (assume 8hr max day)
  const dayPercent = usagePercent(totalSeconds, 8 * 3600);
  summaryBarEl.style.width = `${dayPercent}%`;

  // Site list (sorted by usage desc)
  const entries = Object.entries(today).sort((a, b) => b[1] - a[1]);
  siteListEl.innerHTML = '';

  if (entries.length === 0) {
    siteListEl.innerHTML = '<li class="site-empty">No usage tracked yet today</li>';
    return;
  }

  for (const [domain, seconds] of entries.slice(0, 8)) {
    const limit = limits[domain] || null;
    const pct = limit ? usagePercent(seconds, limit) : 0;
    const barClass = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : '';

    const li = document.createElement('li');
    li.className = 'site-item';
    li.innerHTML = `
      <div class="site-info">
        <img class="site-favicon" src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" alt="">
        <span class="site-domain">${domain}</span>
      </div>
      <div class="site-right">
        <span class="site-time">${formatTime(seconds)}</span>
        ${limit ? `<div class="site-bar-track"><div class="site-bar-fill ${barClass}" style="width:${pct}%"></div></div>` : ''}
      </div>
    `;
    siteListEl.appendChild(li);
  }
}

// ── Focus Mode ──

async function loadFocusState() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.FOCUS);
  const focus = r[STORAGE_KEYS.FOCUS] || { active: false, endTime: null };

  if (focus.active && focus.endTime > Date.now()) {
    focusBtn.classList.add('active');
    const remaining = Math.floor((focus.endTime - Date.now()) / 60000);
    focusLabel.textContent = `Focus (${remaining}m left)`;
    cancelFocus.classList.remove('hidden');
  } else {
    focusBtn.classList.remove('active');
    focusLabel.textContent = 'Focus Mode';
    cancelFocus.classList.add('hidden');
    // Auto-disable expired focus
    if (focus.active) {
      await chrome.storage.local.set({ [STORAGE_KEYS.FOCUS]: { active: false, endTime: null } });
    }
  }
}

focusBtn.addEventListener('click', () => {
  focusPanel.classList.toggle('hidden');
  strictPanel.classList.add('hidden');
});

document.querySelectorAll('.focus-duration').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const minutes = parseInt(btn.dataset.minutes);
    const endTime = Date.now() + minutes * 60000;
    await chrome.storage.local.set({ [STORAGE_KEYS.FOCUS]: { active: true, endTime } });
    focusPanel.classList.add('hidden');
    loadFocusState();
  });
});

cancelFocus.addEventListener('click', async () => {
  await chrome.storage.local.set({ [STORAGE_KEYS.FOCUS]: { active: false, endTime: null } });
  loadFocusState();
});

// ── Strict Mode ──

async function loadStrictState() {
  const r = await chrome.storage.local.get(STORAGE_KEYS.STRICT);
  const strict = r[STORAGE_KEYS.STRICT] || { active: false, endTime: null };

  if (strict.active && strict.endTime > Date.now()) {
    strictBtn.classList.add('active');
  } else {
    strictBtn.classList.remove('active');
  }
}

strictBtn.addEventListener('click', () => {
  strictPanel.classList.toggle('hidden');
  focusPanel.classList.add('hidden');
});

document.querySelectorAll('.strict-duration').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const minutes = parseInt(btn.dataset.minutes);
    const endTime = Date.now() + minutes * 60000;
    await chrome.storage.local.set({
      [STORAGE_KEYS.STRICT]: { active: true, endTime },
    });
    strictPanel.classList.add('hidden');
    loadStrictState();
    // Tell background to enforce immediately
    chrome.runtime.sendMessage({ type: 'ENFORCE_STRICT' });
  });
});

// ── Settings button ──
settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// ── Flush background timer before reading data ──
async function flushBackground() {
  try {
    await chrome.runtime.sendMessage({ type: 'FLUSH_TIME' });
  } catch {
    // Background might not be ready yet
  }
}

// ── Full refresh: flush then load everything ──
async function refreshAll() {
  await flushBackground();
  await loadUsage();
  loadFocusState();
  loadStrictState();
}

// ── Init ──
refreshAll();

// Refresh every 2 seconds while popup is open (popup has its own lifecycle)
setInterval(refreshAll, 2000);
