// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  const saved = localStorage.getItem('mr_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  themeToggle.textContent = saved === 'dark' ? '🌙' : '☀️';

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('mr_theme', next);
    themeToggle.textContent = next === 'dark' ? '🌙' : '☀️';
  });
}

// Copy IP
const copyBtns = document.querySelectorAll('.copy-ip');
copyBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navigator.clipboard.writeText('Play.MineRise.Fun');
    btn.textContent = 'Copied!';
    setTimeout(() => (btn.textContent = 'Copy IP'), 2000);
  });
});
