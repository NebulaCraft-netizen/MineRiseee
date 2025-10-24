// Shared site JS: theme toggle, copy IP, nav active highlight, small greys
(function(){
  // set year placeholders
  const years = [ 'year', 'year2', 'year3', 'year4' ];
  years.forEach(id => { const el = document.getElementById(id); if(el) el.textContent = new Date().getFullYear(); });

  // Theme toggle
  const toggles = document.querySelectorAll('#theme-toggle');
  const THEME_KEY = 'mr_theme';
  function setTheme(t){
    document.documentElement.setAttribute('data-theme', t);
    // update all theme buttons text
    toggles.forEach(b => { b.textContent = t === 'dark' ? '🌙' : '☀️'; });
    localStorage.setItem(THEME_KEY, t);
  }
  const saved = localStorage.getItem(THEME_KEY) || (window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  setTheme(saved);
  toggles.forEach(btn => btn.addEventListener('click', ()=> setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark')) );

  // Copy IP behavior
  document.querySelectorAll('.copy-ip').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('Play.MineRise.Fun');
        const old = btn.innerHTML;
        btn.innerHTML = 'Copied!';
        setTimeout(()=> btn.innerHTML = old, 1500);
      } catch(e){ console.warn('copy failed', e) }
    });
  });

  // players mock counter (home)
  const playersEl = document.getElementById('players');
  if(playersEl) setInterval(()=> { playersEl.textContent = Math.max(0, parseInt(playersEl.textContent||'42') + (Math.random()>0.5?1:-1)); }, 3000);

  // small accessible aria-live for copy (optional)
  const live = document.createElement('div'); live.setAttribute('aria-live','polite'); live.style.position='fixed'; live.style.left='-9999px'; document.body.appendChild(live);

  // mark active nav by matching file name
  (function markActiveNav(){
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('nav a.nav-btn').forEach(a => {
      const href = a.getAttribute('href') || '';
      if(href.endsWith(path)) { a.classList.add('active'); } else { a.classList.remove('active'); }
    });
  })();
})();
