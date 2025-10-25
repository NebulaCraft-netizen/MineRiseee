/* scripts/main.js
   Figma-like UI interactions & micro-animations:
   - Floating panel drag (for desktop)
   - Hover elevation / smooth shadows
   - Modal open/close helper (for any page)
   - Micro-interaction for store cards (3D tilt)
*/

(function() {
  // Simple utility to add hover lift effect to elements with .lift class
  document.querySelectorAll('.lift').forEach(el => {
    el.style.transition = 'transform 220ms cubic-bezier(.22,.9,.35,1), box-shadow 220ms';
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'translateY(-8px) scale(1.02)';
      el.style.boxShadow = '0 20px 50px rgba(2,8,20,0.45)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      el.style.boxShadow = '';
    });
  });

  // 3D tilt effect for elements with .tilt (store cards / product cards)
  const tiltEls = document.querySelectorAll('.tilt');
  tiltEls.forEach(el => {
    el.style.transition = 'transform 220ms cubic-bezier(.22,.9,.35,1), box-shadow 220ms';
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (py - 0.5) * 10; // rotate X
      const ry = (px - 0.5) * -14; // rotate Y
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(8px)`;
      el.style.boxShadow = '0 30px 80px rgba(2,8,20,0.48)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      el.style.boxShadow = '';
    });
  });

  // Floating panel drag (desktop) for element with id 'floating-panel' (optional)
  (function initDrag() {
    const panel = document.getElementById('floating-panel');
    if (!panel) return;
    panel.style.cursor = 'grab';
    let dragging = false, ox=0, oy=0, startX=0, startY=0;
    panel.addEventListener('pointerdown', (ev) => {
      dragging = true; panel.setPointerCapture(ev.pointerId);
      ox = panel.offsetLeft; oy = panel.offsetTop;
      startX = ev.clientX; startY = ev.clientY;
      panel.style.transition = 'none';
      panel.style.cursor = 'grabbing';
    });
    window.addEventListener('pointermove', (ev) => {
      if (!dragging) return;
      const nx = ox + (ev.clientX - startX);
      const ny = oy + (ev.clientY - startY);
      panel.style.left = `${nx}px`;
      panel.style.top = `${ny}px`;
    });
    window.addEventListener('pointerup', (ev) => {
      if (!dragging) return;
      dragging = false;
      panel.style.transition = '';
      panel.style.cursor = 'grab';
      try { panel.releasePointerCapture && panel.releasePointerCapture(ev.pointerId); } catch(e){}
    });
  })();

  // Modal helper: use data-modal-target attribute on open buttons and .modal with id
  document.querySelectorAll('[data-modal-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-modal-target');
      const modal = document.getElementById(id);
      if (!modal) return;
      modal.style.display = 'block';
      setTimeout(()=> modal.classList.add('open'), 20);
    });
  });
  document.querySelectorAll('.modal .close, .modal').forEach(el => {
    el.addEventListener('click', (e) => {
      const modal = el.closest('.modal') || el;
      if (!modal) return;
      modal.classList.remove('open');
      setTimeout(()=> modal.style.display = 'none', 220);
    });
  });

  // Slight entrance animation for .fade-in elements
  document.querySelectorAll('.fade-in').forEach((el, i) => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(6px)';
    el.style.transition = 'opacity 520ms ease, transform 520ms ease';
    setTimeout(()=> { el.style.opacity = 1; el.style.transform = 'translateY(0)'; }, 70 + i*80);
  });

})();

