// scripts/main.js
// Handles theme toggle, tilt micro-interaction, currency localization, and simple shop state

// THEME
(function(){
  const THEME_KEY = 'mr_theme';
  function applyTheme(t){ document.documentElement.setAttribute('data-theme', t); document.querySelectorAll('#theme-toggle').forEach(b=>b.textContent = t==='dark' ? '🌙' : '☀️'); localStorage.setItem(THEME_KEY,t); }
  const saved = localStorage.getItem(THEME_KEY) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(saved);
  document.querySelectorAll('#theme-toggle').forEach(b=>b.addEventListener('click', ()=>{ const cur = document.documentElement.getAttribute('data-theme') || 'dark'; applyTheme(cur==='dark' ? 'light' : 'dark'); }));
})();

// TILT
(function(){
  document.addEventListener('mousemove', (e)=>{
    document.querySelectorAll('.tilt').forEach(el=>{
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      if (px>=0 && px<=1 && py>=0 && py<=1) {
        const rx = (py - 0.5) * 10;
        const ry = (px - 0.5) * -14;
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
        el.style.boxShadow = '0 30px 80px rgba(2,8,20,0.48)';
      } else {
        el.style.transform = '';
        el.style.boxShadow = '';
      }
    });
  });
  document.addEventListener('mouseleave', ()=>{ document.querySelectorAll('.tilt').forEach(el=>{ el.style.transform=''; el.style.boxShadow=''; }); });
})();

// TOAST
function toast(msg) {
  const t = document.getElementById('toast');
  if(!t) return alert(msg);
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(t._hide);
  t._hide = setTimeout(()=> t.style.display = 'none', 2200);
}

// SHOP state (local-only demo)
(function(){
  const STORAGE_KEY = 'minerise_store_v1';
  const defaultState = { keys:0, rankKeys:0, shards:0, coins:0, ownedRank: null, lastClaim: 0 };
  function loadState(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState; } catch(e){ return defaultState; } }
  function saveState(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); renderBalances(); }
  function renderBalances(){
    const s = loadState();
    const elKeys = document.getElementById('balance-keys'); if(elKeys) elKeys.textContent = 'Keys: ' + (s.keys||0);
    const elRank = document.getElementById('balance-rankkeys'); if(elRank) elRank.textContent = 'Rank Keys: ' + (s.rankKeys||0);
    const elShards = document.getElementById('balance-shards'); if(elShards) elShards.textContent = 'Shards: ' + (s.shards||0);
    const elCoins = document.getElementById('balance-coins'); if(elCoins) elCoins.textContent = 'Coins: ' + (s.coins||0);
  }

  window.buy = function(item){
    const s = loadState();
    switch(item){
      case 'bat': s.ownedRank = 'bat'; toast('Bought Bat rank (demo). You now get 1 daily key.'); break;
      case 'warden': s.ownedRank = 'warden'; toast('Bought Warden rank (demo). You now get 1 daily key.'); break;
      case 'rise': s.ownedRank = 'rise'; toast('Bought Rise rank (demo). You now get 1 daily key.'); break;
      case 'key': s.keys = (s.keys||0) + 1; toast('Key purchased (demo)'); break;
      case 'rankKey': s.rankKeys = (s.rankKeys||0) + 1; toast('Rank Key purchased (demo)'); break;
      case 'shards': s.shards = (s.shards||0) + 5; toast('Shard pack purchased (demo) +5'); break;
      case 'coins': s.coins = (s.coins||0) + 50; toast('Coin pack purchased (demo) +50'); break;
      default: toast('Unknown item'); break;
    }
    saveState(s);
  };

  window.gift = function(rank){
    toast('Gift flow placeholder — open your Discord/Tebex to gift');
  };

  window.claimDailyKey = function(){
    const s = loadState();
    if(!s.ownedRank){ toast('No rank found — buy a rank to get daily key'); return; }
    const now = Date.now();
    const last = s.lastClaim || 0;
    const day = 24*60*60*1000;
    if (now - last < day){ const next = new Date(last + day); toast('Daily key already claimed — next at: ' + next.toLocaleString()); return; }
    s.keys = (s.keys||0) + 1;
    s.lastClaim = now;
    saveState(s);
    toast('Daily key claimed! +1 Key');
  };

  document.addEventListener('DOMContentLoaded', ()=>{ setTimeout(()=>{ if(typeof window.initThree === 'function') try{ window.initThree({}); } catch(e){} },700); renderBalances(); });
})();
