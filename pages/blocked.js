// ══════════════════════════════════════════════════════════
//  BlockTab — Blocked Page Script
// ══════════════════════════════════════════════════════════

const STORAGE_KEYS = { USAGE: 'bt_usage', LIMITS: 'bt_limits' };

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(sec) {
  if (!sec || sec < 0) return '0s';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (h === 0 && m === 0) parts.push(`${Math.floor(sec)}s`);
  return parts.join(' ') || '0s';
}

// Get blocked domain from URL params
const params = new URLSearchParams(window.location.search);
const domain = params.get('domain') || 'this site';

document.getElementById('domain').textContent = domain;

// Load stats
(async () => {
  const usageResult = await chrome.storage.local.get(STORAGE_KEYS.USAGE);
  const allUsage = usageResult[STORAGE_KEYS.USAGE] || {};
  const today = allUsage[getTodayKey()] || {};
  const used = today[domain] || 0;

  const limitsResult = await chrome.storage.local.get(STORAGE_KEYS.LIMITS);
  const limits = limitsResult[STORAGE_KEYS.LIMITS] || {};
  const limit = limits[domain] || 0;

  document.getElementById('timeUsed').textContent = formatTime(used);
  document.getElementById('dailyLimit').textContent = limit ? formatTime(limit) : 'None';
})();

// Writing challenge button
document.getElementById('writingBtn').addEventListener('click', () => {
  const writingUrl = chrome.runtime.getURL(`pages/writing.html?domain=${encodeURIComponent(domain)}`);
  window.location.href = writingUrl;
});

// Dashboard button
document.getElementById('dashboardBtn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
