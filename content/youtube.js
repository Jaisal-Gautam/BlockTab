// ══════════════════════════════════════════════════════════
//  BlockTab — YouTube Content Script
//  Runs on *://*.youtube.com/* — manipulates YouTube DOM
//  to hide Shorts, comments, recommendations, disable autoplay.
//  Settings are read from chrome.storage.local (no imports needed).
// ══════════════════════════════════════════════════════════

(function () {
  'use strict';

  const SETTINGS_KEY = 'bt_settings';

  // ── Read settings from storage ──
  async function getYouTubeSettings() {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    const settings = result[SETTINGS_KEY] || {};
    return settings.youtube || {
      hideShorts: false,
      hideComments: false,
      hideRecommendations: false,
      disableAutoplay: false,
    };
  }

  // ── CSS injection helper ──
  function injectCSS(id, css) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('style');
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = css;
  }

  function removeCSS(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  // ── Hide Shorts ──
  function applyHideShorts(enabled) {
    const id = 'bt-hide-shorts';
    if (enabled) {
      // 1) CSS: hide all Shorts UI elements across YouTube
      injectCSS(id, `
        /* Shorts shelf on home page */
        ytd-rich-shelf-renderer[is-shorts],
        ytd-reel-shelf-renderer,
        /* Shorts section in search results */
        ytd-reel-shelf-renderer,
        /* Shorts tab on channel pages */
        tp-yt-paper-tab:has(> div[tab-title="Shorts"]),
        yt-tab-shape[tab-title="Shorts"],
        /* Shorts in sidebar / mini guide */
        ytd-mini-guide-entry-renderer[aria-label="Shorts"],
        ytd-guide-entry-renderer a[title="Shorts"],
        ytd-guide-entry-renderer:has(a[href="/shorts"]),
        /* Shorts notification chip */
        ytd-rich-section-renderer:has(ytd-reel-shelf-renderer),
        /* Shorts badges and overlays */
        [is-shorts],
        ytd-reel-item-renderer {
          display: none !important;
        }
      `);

      // 2) Redirect: if user navigates to /shorts/xxx, convert to /watch?v=xxx
      redirectIfShorts();
    } else {
      removeCSS(id);
    }
  }

  // Redirect /shorts/VIDEO_ID → /watch?v=VIDEO_ID
  function redirectIfShorts() {
    const path = window.location.pathname;
    if (path.startsWith('/shorts/')) {
      const videoId = path.split('/shorts/')[1]?.split('?')[0]?.split('/')[0];
      if (videoId) {
        // Replace with regular watch URL (keeps user on YouTube but not Shorts)
        window.location.replace(`https://www.youtube.com/watch?v=${videoId}`);
      } else {
        // No video ID — go to home
        window.location.replace('https://www.youtube.com/');
      }
    }
  }

  // ── Hide Comments ──
  function applyHideComments(enabled) {
    const id = 'bt-hide-comments';
    if (enabled) {
      injectCSS(id, `
        ytd-comments#comments,
        #comments,
        ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-comments-section"] {
          display: none !important;
        }
      `);
    } else {
      removeCSS(id);
    }
  }

  // ── Hide Recommendations ──
  function applyHideRecommendations(enabled) {
    const id = 'bt-hide-recs';
    if (enabled) {
      injectCSS(id, `
        /* Sidebar recommendations on watch page */
        #secondary #related,
        #related,
        ytd-watch-next-secondary-results-renderer,
        /* End screen recommendations */
        .ytp-endscreen-content,
        .ytp-ce-element,
        /* Home feed — hide all video suggestions */
        ytd-browse[page-subtype="home"] ytd-rich-grid-renderer {
          display: none !important;
        }
      `);
    } else {
      removeCSS(id);
    }
  }

  // ── Disable Autoplay ──
  function applyDisableAutoplay(enabled) {
    if (!enabled) return;

    function disableToggle() {
      // Method 1: Click the autoplay toggle if it's ON
      const toggle = document.querySelector('.ytp-autonav-toggle-button');
      if (toggle) {
        const isOn = toggle.getAttribute('aria-checked') === 'true';
        if (isOn) toggle.click();
      }
      // Method 2: Also try the new toggle location
      const toggle2 = document.querySelector('[data-tooltip-target-id="ytp-autonav-toggle-button"]');
      if (toggle2) {
        const isOn = toggle2.getAttribute('aria-checked') === 'true';
        if (isOn) toggle2.click();
      }
    }

    disableToggle();
    const observer = new MutationObserver(() => {
      disableToggle();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Main: apply all settings ──
  async function applyAll() {
    const settings = await getYouTubeSettings();
    applyHideShorts(settings.hideShorts);
    applyHideComments(settings.hideComments);
    applyHideRecommendations(settings.hideRecommendations);
    applyDisableAutoplay(settings.disableAutoplay);
  }

  // Run on load
  applyAll();

  // Re-apply when YouTube navigates (SPA — YouTube doesn't do full page reloads)
  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      applyAll();
    }
  });
  urlObserver.observe(document.body, { childList: true, subtree: true });

  // Also listen for yt-navigate-finish (YouTube's custom SPA event)
  document.addEventListener('yt-navigate-finish', () => {
    applyAll();
  });

  // Re-apply when settings change in real time
  chrome.storage.onChanged.addListener((changes) => {
    if (changes[SETTINGS_KEY]) {
      applyAll();
    }
  });
})();
