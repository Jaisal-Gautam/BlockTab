// ══════════════════════════════════════════════════════════
//  BlockTab — Writing Challenge Script
//  Preset passage, no copy/paste. Handles both:
//    • Normal time-limit unlock (free-write, 200 chars)
//    • Blocked-group unlock (must type passage exactly, once/day, 5 min)
// ══════════════════════════════════════════════════════════

const PASSAGES = [
  "The mind is not a vessel to be filled but a fire to be kindled. Every great action begins with a single decision made in a moment of clarity. Focus is not the absence of distraction but the presence of intention. When you choose where your attention goes, you choose who you become. The quality of your work reflects the quality of your attention. A distracted mind produces distracted results. A focused mind produces work that matters. Start before you feel ready. Finish what you begin. Return to this truth whenever the noise of the world pulls you away from what is important. You are the author of your time.",
  "Discipline is choosing between what you want now and what you want most. The person who cannot delay gratification rarely achieves anything lasting. Every skill worth having was built through hours of practice that felt unremarkable in the moment. The gap between who you are and who you want to be is bridged only by consistent daily action. Not inspiration. Not motivation. Action. Show up when it is hard. Do the work when you do not feel like it. That is when character is built. That is when real progress happens. Everything else is just waiting.",
  "Clarity of purpose is the most powerful productivity tool that exists. When you know exactly what you are working toward and why it matters, distraction loses its grip. The problem is rarely a lack of information. It is a lack of direction. Set a single clear priority for this moment. Work on it completely. Resist the urge to check, scroll, or switch. The compounding effect of one hour of genuine focus each day over years is extraordinary. Most people never experience it because they never actually try. You can be different. Begin now.",
];

const UNLOCK_MINUTES = 5;
const MIN_CHARS = 200;

const params = new URLSearchParams(window.location.search);
const domain = params.get('domain') || '';
const fromBlocked = params.get('fromBlocked') === '1';

// Pick a consistent passage for this domain today (not random each reload)
const dayKey = new Date().toISOString().split('T')[0];
const passageIndex = (domain.length + dayKey.split('-').reduce((a,c) => a + parseInt(c), 0)) % PASSAGES.length;
const passage = PASSAGES[passageIndex];

// ── DOM refs ──
const domainEl = document.getElementById('domain');
const blockedNote = document.getElementById('blockedNote');
const passageBox = document.getElementById('passageBox');
const textarea = document.getElementById('textarea');
const charCountEl = document.getElementById('charCount');
const totalCharsEl = document.getElementById('totalChars');
const errorMsg = document.getElementById('errorMsg');
const unlockBtn = document.getElementById('unlockBtn');
const backBtn = document.getElementById('backBtn');

// ── Setup ──
domainEl.textContent = domain || 'this site';
if (fromBlocked) blockedNote.classList.remove('hidden');

// Render passage (un-selectable)
passageBox.textContent = passage;
totalCharsEl.textContent = passage.length;

// ── Block copy/paste on textarea ──
['paste', 'copy', 'cut'].forEach(evt =>
  textarea.addEventListener(evt, e => e.preventDefault())
);
textarea.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && ['v','c','x'].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});
// Block selection on passage
passageBox.addEventListener('copy', e => e.preventDefault());
passageBox.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('selectstart', e => {
  if (passageBox.contains(e.target)) e.preventDefault();
});

// ── Typing logic ──
textarea.addEventListener('input', () => {
  const typed = textarea.value;
  charCountEl.textContent = typed.length;

  // Check match against passage prefix
  const matches = passage.startsWith(typed);
  if (typed.length > 0 && !matches) {
    errorMsg.classList.remove('hidden');
  } else {
    errorMsg.classList.add('hidden');
  }

  const ready = typed.length >= passage.length && typed === passage;
  unlockBtn.disabled = !ready;
});

// ── Unlock ──
unlockBtn.addEventListener('click', async () => {
  if (textarea.value !== passage) return;

  if (fromBlocked) {
    // Blocked-group unlock: record daily usage + 5-min window
    const r = await chrome.storage.local.get('bt_bg_unlocks');
    const unlocks = r.bt_bg_unlocks || {};
    const today = new Date().toISOString().split('T')[0];
    unlocks[domain] = {
      date: today,
      unlockUntil: Date.now() + UNLOCK_MINUTES * 60 * 1000,
    };
    await chrome.storage.local.set({ bt_bg_unlocks: unlocks });
  } else {
    // Normal writing unlock: override time limit for 5 min
    const r = await chrome.storage.local.get('bt_writing_unlocks');
    const unlocks = r.bt_writing_unlocks || {};
    unlocks[domain] = Date.now() + UNLOCK_MINUTES * 60 * 1000;
    await chrome.storage.local.set({ bt_writing_unlocks: unlocks });
  }

  if (domain) {
    window.location.href = `https://${domain}`;
  } else {
    window.history.back();
  }
});

backBtn.addEventListener('click', () => window.history.back());
textarea.focus();
