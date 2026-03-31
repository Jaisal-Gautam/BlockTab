// ══════════════════════════════════════════════════════════
//  BlockTab — Strict Mode Page Script
//  Exit requires typing a 500-word passage exactly.
//  Copy/paste is disabled. Passage changes every visit.
// ══════════════════════════════════════════════════════════

// ── 500-word passages (each ~500 words, randomly chosen) ──
const PASSAGES = [
  `The practice of deep focus has become increasingly rare in our distracted world. Every notification, every ping, every scroll competes for our attention, fragmenting the long stretches of concentration that produce meaningful work. Cal Newport, in his influential book on deep work, argues that the ability to focus without distraction on cognitively demanding tasks is becoming both increasingly rare and increasingly valuable. This creates an opportunity for those willing to cultivate it. Deep work is not simply about working harder or longer hours. It is about training your mind to resist the pull of shallow distractions and to sustain attention on what truly matters. The meditator learns to observe thoughts without chasing them. The writer learns to sit with the blank page without immediately reaching for their phone. The programmer learns to hold a complex problem in mind long enough to see its shape clearly. These are learnable skills, not fixed traits. Research in cognitive science suggests that our brains are remarkably plastic. The habits we reinforce become the defaults we fall back on. If we train ourselves to switch tasks every few minutes, that becomes our baseline. If instead we deliberately practice extended periods of single-minded focus, we can rebuild the capacity for sustained attention. The first sessions will feel uncomfortable, perhaps even painful, as the mind rebels against the absence of stimulation. This discomfort is not a sign that something is wrong — it is a sign that you are pushing against previously set limits. Over time, the resistance weakens. The ability to concentrate deepens. Work that once took three interrupted hours can be completed in one uninterrupted hour of genuine focus. Outside of professional productivity, deep focus has another benefit that is often overlooked: it produces a sense of meaning and satisfaction that shallow work cannot replicate. There is a particular quality of contentment that comes from having spent real time and energy on something difficult — from having moved a hard problem forward, or written something true, or built something that required sustained effort. This feeling cannot be hacked or shortcut. It must be earned through genuine engagement. The irony of our attention economy is that the platforms designed to capture and monetize our focus leave us feeling hollow. Each scroll provides a momentary hit of stimulation, but nothing accumulates. Nothing is built. The hours pass and nothing of lasting value emerges. By contrast, a single hour of deep, undistracted work on something meaningful can leave you with energy, clarity, and the quiet satisfaction of genuine progress. Cultivating this capacity starts with small, intentional choices. Turn off notifications. Close unnecessary tabs. Set a timer. Show up to the work before you feel ready. The conditions for focus will never be perfect, and waiting for them to be so is itself a form of avoidance. The work is here. Begin.`,

  `Attention is perhaps the most valuable resource we possess, yet it is the one we most carelessly give away. We hand it to algorithms designed by teams of engineers whose sole job is to ensure we keep scrolling, keep watching, keep engaging. We surrender it to anxieties about the future and regrets about the past, leaving little for the present moment in which our actual lives are unfolding. Reclaiming attention is not a passive process. It requires deliberate effort, consistent practice, and a willingness to sit with discomfort when the old habits of distraction reassert themselves. The philosopher William James wrote over a century ago that the faculty of voluntarily bringing back a wandering attention, over and over again, is the very root of judgment, character, and will. He believed that an education which should improve this faculty would be the education par excellence. Yet we have built an educational and commercial infrastructure that runs in precisely the opposite direction, training us from childhood to respond to ever-faster stimuli and punishing sustained reflection. The result is a culture that is simultaneously overstimulated and understimulated. We consume vast quantities of content yet feel chronically bored. We are surrounded by more information than any previous generation yet feel less capable of making sense of the world. We have more tools for communication than ever before yet often feel profoundly disconnected from ourselves and others. The antidote is not to retreat entirely from technology — that ship has likely sailed for most of us — but to develop a more intentional relationship with it. To ask, before opening an app or clicking a link, whether this will genuinely add something to my life or simply pass the time. To recognize that passing time is not the same as spending it well. To understand that boredom is not an emergency requiring immediate relief, but a signal worth sitting with, a doorway into deeper thinking. The person who can tolerate ten minutes of boredom without reaching for their phone is a person who has access to a quality of thought that the constantly stimulated mind cannot reach. The ideas that arise in silence, in the quiet between tasks — these are often the most original, precisely because they emerge from a mind that has room to wander productively. Building this capacity takes time. It is built in small increments, through consistent practice of paying attention to what is actually in front of you, whether that is a conversation, a page of text, a piece of music, or simply the sensation of breathing. Over time, these practices compound. The mind becomes a more reliable instrument, capable of finer distinctions and deeper sustained engagement with whatever matters most to you.`,

  `Every meaningful thing ever built required sustained effort over time. The novel did not write itself in an afternoon. The business did not grow overnight. The skill did not appear fully formed. Behind every visible result is an invisible history of consistent, deliberate practice — of showing up when it was hard, when progress was invisible, when doubt was louder than confidence. We live in an era that celebrates outcomes while obscuring process. We see the finished product, the highlight reel, the success story edited for inspiration. What we rarely see is the thousand ordinary days that preceded the visible moment of achievement: the mornings the writer sat down and produced nothing worth keeping, the evenings the entrepreneur stayed late to fix a problem that no one would ever know existed, the years the musician practiced scales in an empty room. This invisibility of process distorts our expectations and feeds a kind of magical thinking about achievement — the belief that other people's results came easily, that our own struggles are signs of inadequacy rather than simply of being in the middle of the process. The antidote to this distortion is a deeper appreciation for duration. Real competence accumulates slowly. Real understanding deepens gradually. The person who has spent ten thousand hours genuinely engaged with a domain does not think or see the same way as the beginner. They have developed pattern recognition, intuition, and judgment that cannot be downloaded or shortcut. These capacities are the product of time and attention, given freely and consistently over years. There is a particular kind of satisfaction available only to those who have stayed with something long enough to see it change — who have watched a skill develop from clumsy effort to smooth execution, who have seen a project move from vague intention to concrete reality, who have experienced the compound growth that only becomes visible in retrospect. This satisfaction is not available to the perpetual beginner who moves on before any real depth is reached. It requires a kind of loyalty to the process, a willingness to push through the awkward middle stages where progress is real but not yet impressive, where you know enough to see how much you don't know, where giving up feels rational but continuing forward is the only path to what you actually want. The things worth doing are almost always hard. They require more than you expect, take longer than you plan, and test your commitment in ways you didn't anticipate. This is not a flaw in the design of meaningful endeavor. It is the design. The difficulty is the filter. It ensures that the reward — the real reward of genuine capability, genuine contribution, genuine growth — goes to those willing to stay.`
];

// ── Pick a random passage each visit ──
const passage = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
const REQUIRED_WORDS = 500;

// ── Count words ──
function countWords(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

// ── Render passage ──
const passageBox = document.getElementById('passageBox');
passageBox.textContent = passage;

// ── Block copy/paste on textarea ──
const input = document.getElementById('challengeInput');
input.addEventListener('paste', (e) => { e.preventDefault(); });
input.addEventListener('copy', (e) => { e.preventDefault(); });
input.addEventListener('cut', (e) => { e.preventDefault(); });

// Block paste via keyboard shortcut
input.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && ['v', 'c', 'x'].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});

// Also block on the passage box
passageBox.addEventListener('copy', (e) => { e.preventDefault(); });
passageBox.addEventListener('contextmenu', (e) => { e.preventDefault(); });
document.addEventListener('selectstart', (e) => {
  if (e.target === passageBox || passageBox.contains(e.target)) {
    e.preventDefault();
  }
});

// ── Progress tracking ──
const progressFill = document.getElementById('progressFill');
const wordCountEl = document.getElementById('wordCount');
const unlockBtn = document.getElementById('unlockBtn');
const errorMsg = document.getElementById('errorMsg');

input.addEventListener('input', () => {
  const typed = input.value;
  const words = countWords(typed);
  const target = REQUIRED_WORDS;
  const pct = Math.min(100, Math.round((words / target) * 100));

  wordCountEl.textContent = `${words} / ${target} words`;
  progressFill.style.width = `${pct}%`;

  // Check if typed text matches the start of the passage
  const passageWords = passage.trim().split(/\s+/);
  const typedWords = typed.trim().split(/\s+/).filter(Boolean);
  let matches = true;
  for (let i = 0; i < typedWords.length; i++) {
    if (typedWords[i] !== passageWords[i]) {
      matches = false;
      break;
    }
  }

  if (!matches && typedWords.length > 0) {
    errorMsg.classList.remove('hidden');
  } else {
    errorMsg.classList.add('hidden');
  }

  if (words >= target && matches) {
    unlockBtn.disabled = false;
    progressFill.style.background = 'linear-gradient(90deg, #4ade80, #22c55e)';
  } else {
    unlockBtn.disabled = true;
    progressFill.style.background = '';
  }
});

// ── Unlock: disable strict mode ──
unlockBtn.addEventListener('click', async () => {
  await chrome.storage.local.set({ bt_strict: { active: false, endTime: null } });
  window.history.back();
});

// ── Countdown ──
function formatClock(sec) {
  const h = Math.floor(sec / 3600);
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(Math.floor(sec % 60)).padStart(2, '0');
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

const countdownEl = document.getElementById('countdown');

async function updateCountdown() {
  const r = await chrome.storage.local.get('bt_strict');
  const strict = r.bt_strict || { active: false, endTime: null };
  if (!strict.active || !strict.endTime) {
    countdownEl.textContent = 'Inactive';
    return;
  }
  const remaining = Math.max(0, Math.floor((strict.endTime - Date.now()) / 1000));
  countdownEl.textContent = remaining > 0 ? formatClock(remaining) : 'Ended';
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ── Whitelist ──
const DEFAULT_WHITELIST = [
  'google.com', 'stackoverflow.com', 'github.com',
  'docs.google.com', 'mail.google.com', 'notion.so', 'figma.com',
];
const whitelistEl = document.getElementById('whitelist');
(async () => {
  const r = await chrome.storage.local.get('bt_whitelist');
  const whitelist = r.bt_whitelist || [...DEFAULT_WHITELIST];
  whitelist.sort().forEach((domain) => {
    const li = document.createElement('li');
    li.textContent = domain;
    whitelistEl.appendChild(li);
  });
})();
