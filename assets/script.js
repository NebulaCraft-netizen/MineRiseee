/* assets/script.js
   Entry script for all pages.
   - Theme toggle (persisted)
   - Copy IP buttons
   - Nav active marking
   - Players mock counter
   - Attempts to init the 3D scene (if scripts/threeScene.js is present)
*/

(function() {
  const THEME_KEY = 'mr_theme';
  const DEFAULT_IP = 'Play.MineRise.Fun';

  // Fill year placeholders if present
  ['year','year2','year3','year4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = new Date().getFullYear();
  });

  // Apply theme (dark or light)
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('#theme-toggle, .theme-btn').forEach(btn => {
      btn.textContent = theme === 'dark' ? '🌙' : '☀️';
      btn.setAttribute('aria-pressed', theme === 'dark');
    });
    localStorage.setItem(THEME_KEY, theme);
  }

  // Init theme
  const saved = localStorage.getItem(THEME_KEY) ||
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(saved);

  // Wire toggle buttons
  document.querySelectorAll('#theme-toggle, .theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  });

  // Copy IP handler
  async function copyIPSequence(button) {
    try {
      await navigator.clipboard.writeText(DEFAULT_IP);
      const old = button.innerHTML;
      button.innerHTML = 'Copied!';
      button.disabled = true;
      setTimeout(() => { button.innerHTML = old; button.disabled = false; }, 1400);
    } catch (e) {
      console.warn('copy failed', e);
    }
  }

  document.querySelectorAll('.copy-ip').forEach(btn => {
    btn.addEventListener('click', () => copyIPSequence(btn));
    // also allow clicking the visible ip element
  });
  document.querySelectorAll('#server-ip, #server-ip-2, .ip').forEach(el => {
    el.addEventListener && el.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(DEFAULT_IP); } catch(e){/*ignore*/ }
    });
  });

  // Mark active nav link(s)
  (function markActive() {
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('nav a, .nav-btn, .navbar a').forEach(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (!href) return;
      if (href.endsWith(path) || (path === '' && href.endsWith('index.html'))) a.classList.add('active');
      else a.classList.remove('active');
    });
  })();

  // Players mock counter
  const playersEl = document.getElementById('players');
  if (playersEl) {
    setInterval(() => {
      const cur = Math.max(0, parseInt(playersEl.textContent || '42', 10));
      playersEl.textContent = Math.max(0, cur + (Math.random() > 0.5 ? 1 : -1));
    }, 3000);
  }

  // Try to init 3D scene if available (threeScene exposes window.initThree)
  function tryInitThree() {
    if (typeof window.initThree === 'function') {
      try { window.initThree({ ip: DEFAULT_IP }); }
      catch (err) { console.warn('initThree threw', err); }
    } else {
      // retry once after a small delay (in case threeScene.js loads async)
      setTimeout(() => {
        if (typeof window.initThree === 'function') {
          try { window.initThree({ ip: DEFAULT_IP }); }
          catch (err) { console.warn('initThree threw', err); }
        }
      }, 700);
    }
  }
  tryInitThree();

  // Expose a small API for other scripts to update IP quickly
  window.MineRise = {
    setIP(ip) {
      document.querySelectorAll('#server-ip, #server-ip-2, .ip').forEach(el => {
        if (el.tagName.toLowerCase() === 'input') el.value = ip;
        else el.textContent = ip;
      });
    }
  };

})();
