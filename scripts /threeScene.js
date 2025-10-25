/* assets/threeScene.js
   Lightweight three.js scene loader (dynamically loads three.js)
   - Adds a canvas to #three-container (creates container if missing)
   - Creates simple floating pumpkins and bat shapes
   - Accepts options via initThree({ ip: 'Play.MineRise.Fun' })
   - NOTE: loads THREE from CDN. If you prefer offline, replace the CDN URL with a local file.
*/

(function () {
  // CDN URL (non-module version)
  const THREE_CDN = 'https://unpkg.com/three@0.152.2/build/three.min.js';

  // Utility: append non-module THREE script and return Promise when available
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }

  // The main init function exposed as window.initThree
  window.initThree = async function initThree(opts = {}) {
    // try to load THREE
    if (typeof window.THREE === 'undefined') {
      try {
        await loadScript(THREE_CDN);
      } catch (e) {
        console.warn('Failed to load THREE from CDN', e);
        return;
      }
    }
    const THREE = window.THREE;
    if (!THREE) return;

    // Prepare container
    let container = document.getElementById('three-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'three-container';
      document.body.appendChild(container);
    }

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.zIndex = '0';
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    // Scene + Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 2.5, 8);

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xffb86b, 0.9);
    dir.position.set(5, 10, 5);
    scene.add(dir);

    // Ground subtle plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.02 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -3;
    scene.add(ground);

    // Pumpkin maker (sphere + stem)
    function makePumpkin(color = 0xff7a1a, scale = 1) {
      const g = new THREE.Group();
      const bodyGeo = new THREE.SphereGeometry(0.9 * scale, 16, 12);
      const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.scale.y = 0.8;
      g.add(body);

      const stemGeo = new THREE.CylinderGeometry(0.06 * scale, 0.12 * scale, 0.35 * scale, 8);
      const stem = new THREE.Mesh(stemGeo, new THREE.MeshStandardMaterial({ color: 0x3b2b18 }));
      stem.position.y = 0.9 * scale;
      stem.rotation.x = 0.2;
      g.add(stem);

      return g;
    }

    // Add pumpkins
    const pumpkins = [];
    for (let i = 0; i < 6; i++) {
      const s = 0.7 + Math.random() * 0.9;
      const p = makePumpkin(0xff8a2b, s);
      p.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.25) * 2 + 1, (Math.random() - 0.5) * 6);
      p.rotation.y = Math.random() * Math.PI * 2;
      scene.add(p);
      pumpkins.push({ mesh: p, speed: 0.2 + Math.random() * 0.6, xo: p.position.x, yo: p.position.y });
    }

    // Simple bat geometry (approx)
    function makeBat() {
      const geom = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        -0.8, 0, 0,  0, 0.2, 0,   0.8, 0, 0,
        -0.8, 0, 0, -1.6, -0.6, 0,  0, -0.2, 0
      ]);
      geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geom.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.9, metalness: 0.0 });
      const m = new THREE.Mesh(geom, mat);
      m.scale.set(0.9, 0.9, 0.9);
      return m;
    }

    const bats = [];
    for (let i = 0; i < 3; i++) {
      const b = makeBat();
      b.position.set((Math.random() - 0.5) * 20, 2 + Math.random() * 4, -6 + Math.random() * 6);
      b.rotation.z = (Math.random() - 0.5) * 0.8;
      scene.add(b);
      bats.push({ mesh: b, speed: 0.4 + Math.random() * 0.6 });
    }

    // Glow lights group
    const glow = new THREE.Group();
    for (let i = 0; i < 20; i++) {
      const pl = new THREE.PointLight(0xff8a2b, 0.08, 8);
      pl.position.set((Math.random() - 0.5) * 10, Math.random() * 3, (Math.random() - 0.5) * 6);
      glow.add(pl);
    }
    scene.add(glow);

    // Animation loop
    let t = 0;
    function animate() {
      t += 0.01;
      pumpkins.forEach((p, i) => {
        p.mesh.position.y = p.yo + Math.sin(t * p.speed + i) * 0.28;
        p.mesh.rotation.y += 0.002 + (i % 2 ? 0.002 : -0.002);
      });
      bats.forEach((b, i) => {
        b.mesh.position.x += Math.sin(t * b.speed + i) * 0.02;
        b.mesh.position.y += Math.cos(t * b.speed + i) * 0.01;
        b.mesh.rotation.z = Math.sin(t * b.speed + i) * 0.4;
        if (b.mesh.position.x > 16) b.mesh.position.x = -18;
      });
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    // Resize
    function onResize() {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);

    // Mouse parallax
    window.addEventListener('mousemove', (ev) => {
      const nx = (ev.clientX / window.innerWidth - 0.5) * 2;
      const ny = (ev.clientY / window.innerHeight - 0.5) * 2;
      camera.position.x += (nx * 0.8 - camera.position.x) * 0.04;
      camera.position.y += (-ny * 0.6 - camera.position.y) * 0.04;
      camera.lookAt(0, 0.8, 0);
    });

    // Update any .ip or #server-ip elements if opts.ip set
    if (opts && typeof opts.ip === 'string') {
      const ipEls = document.querySelectorAll('.ip, #server-ip, #server-ip-2');
      ipEls.forEach(el => {
        if (el.tagName.toLowerCase() === 'input') el.value = opts.ip;
        else el.textContent = opts.ip;
      });
    }

    console.log('threeScene initialized');
    return { scene, camera, renderer };
  };

})();
