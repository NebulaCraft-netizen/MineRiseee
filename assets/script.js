/* assets/script.js
   - Theme toggle (persists to localStorage)
   - Copy IP buttons
   - Mark active nav link
   - Small UI helpers (players mock)
   - Attempts to init 3D if threeScene.js is present
*/

(function () {
  const THEME_KEY = 'mr_theme';
  const DEFAULT_IP = 'Play.MineRise.Fun';

  // set year placeholders if present
  ['year','year2','year3','year4'].forEach(id=>{
    const e = document.getElementById(id);
    if(e) e.textContent = new Date().getFullYear();
  });

  // Theme toggle: find all #theme-toggle buttons (some pages have one)
  function applyTheme(t){
    document.documentElement.setAttribute('data-theme', t);
    document.querySelectorAll('#theme-toggle, .theme-btn').forEach(btn=>{
      btn.textContent = (t === 'dark' ? '🌙' : '☀️');
      btn.setAttribute('aria-pressed', t === 'dark');
    });
    localStorage.setItem(THEME_KEY, t);
  }
  const saved = localStorage.getItem(THEME_KEY) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(saved);

  document.querySelectorAll('#theme-toggle, .theme-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });
  });

  // Copy IP
  document.querySelectorAll('.copy-ip').forEach(btn=>{
    btn.addEventListener('click', async (ev) => {
      try {
        await navigator.clipboard.writeText(DEFAULT_IP);
        const old = btn.innerHTML;
        btn.innerHTML = 'Copied!';
        setTimeout(()=> btn.innerHTML = old, 1400);
      } catch (err) {
        console.warn('Copy failed', err);
      }
    });
  });

  // Mark active nav based on filename
  (function markActive(){
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a, .nav-btn, .navbar a').forEach(a=>{
      const href = a.getAttribute('href') || '';
      // match index.html and empty path
      if (href.endsWith(path) || (path === '' && href.endsWith('index.html'))) {
        a.classList.add('active');
      } else {
        a.classList.remove('active');
      }
    });
  })();

  // players counter mock (home page)
  const playersEl = document.getElementById('players');
  if(playersEl) {
    setInterval(()=> {
      const current = parseInt(playersEl.textContent || '42', 10);
      const delta = Math.random() > 0.5 ? 1 : -1;
      playersEl.textContent = Math.max(0, current + delta);
    }, 3000);
  }

  // Best-effort: try to init 3D if threeScene.js set window.initThree
  function tryInitThree() {
    if (typeof window.initThree === 'function') {
      try { window.initThree({ ip: DEFAULT_IP }); } catch (e) { console.warn('three init failed', e); }
    } else {
      // If not loaded yet, attempt again after a short delay (for pages that load threeScene.js asynchronously)
      setTimeout(()=> {
        if (typeof window.initThree === 'function') window.initThree({ ip: DEFAULT_IP });
      }, 800);
    }
  }

  // Run initThree if present
  tryInitThree();

})();
