/* scripts/threeScene.js
   3D background scene for Figma-like site.
   - Dynamically loads THREE from CDN if needed
   - Builds a lightweight scene with floating pumpkins, bats, and glow
   - Provides window.initThree(opts) to start the scene
   - opts: { ip: 'Play.MineRise.Fun', quality: 'low|med|high' }
*/

(function() {
  const THREE_CDN = 'https://unpkg.com/three@0.152.2/build/three.min.js';

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }

  window.initThree = async function initThree(opts = {}) {
    // load three if needed
    if (typeof window.THREE === 'undefined') {
      try { await loadScript(THREE_CDN); } catch (e) { console.warn('three load failed', e); return; }
    }
    const THREE = window.THREE;
    if (!THREE) return;

    // Create or reuse container
    let container = document.getElementById('three-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'three-container';
      document.body.appendChild(container);
    }

    // Prevent multiple renderers
    if (container.__initialized) return;
    container.__initialized = true;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.zIndex = '0';
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 1.6, 7);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffb86b, 0.9);
    key.position.set(5, 8, 5);
    scene.add(key);

    // Subtle ground to anchor shadows
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), 
      new THREE.MeshStandardMaterial({ color: 0x000000, transparent:true, opacity:0.01 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.6;
    scene.add(ground);

    // Pumpkin primitive: sphere + segmented indent (simple)
    function makePumpkin(scale=1, color=0xff8a2b) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.9*scale, 18, 12), 
        new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.03 })
      );
      body.scale.y = 0.85;
      group.add(body);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06*scale, 0.12*scale, 0.36*scale, 8),
        new THREE.MeshStandardMaterial({ color: 0x3b2b18, roughness:0.7 })
      );
      stem.position.y = 0.9*scale;
      stem.rotation.x = 0.16;
      group.add(stem);
      return group;
    }

    // Add pumpkins to scene
    const pumpkins = [];
    for (let i=0;i<7;i++) {
      const s = 0.6 + Math.random()*1.0;
      const p = makePumpkin(s);
      p.position.set((Math.random()-0.5)*10, (Math.random()*1.8)+0.6, (Math.random()-0.5)*6);
      p.rotation.y = Math.random()*Math.PI*2;
      scene.add(p);
      pumpkins.push({ mesh: p, baseY: p.position.y, speed: 0.12 + Math.random()*0.34 });
    }

    // Bat primitive (simple plane mesh)
    function makeBat() {
      const shape = new THREE.Shape();
      shape.moveTo(-0.8,0); shape.quadraticCurveTo(-1.2,-0.6,-0.4,-0.2);
      shape.lineTo(0,-0.05); shape.lineTo(0.8,0);
      const extrude = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false });
      const mat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 });
      return new THREE.Mesh(extrude, mat);
    }

    const bats = [];
    for (let i=0;i<3;i++){
      const b = makeBat();
      b.scale.set(0.9,0.9,0.9);
      b.position.set((Math.random()-0.5)*18, 1.8 + Math.random()*3.4, -3 + Math.random()*5);
      scene.add(b);
      bats.push({ mesh: b, speed: 0.4 + Math.random()*0.8 });
    }

    // Ambient glow points
    const glowGroup = new THREE.Group();
    for (let i=0;i<18;i++){
      const pl = new THREE.PointLight(0xff8a2b, 0.06, 10);
      pl.position.set((Math.random()-0.5)*12, Math.random()*3, (Math.random()-0.5)*6);
      glowGroup.add(pl);
    }
    scene.add(glowGroup);

    // Animation loop
    let t = 0;
    function animate() {
      t += 0.01;
      pumpkins.forEach((p, idx) => {
        p.mesh.position.y = p.baseY + Math.sin(t * p.speed + idx) * 0.22;
        p.mesh.rotation.y += 0.003 + (idx % 2 ? 0.002 : -0.002);
      });
      bats.forEach((b, i) => {
        b.mesh.position.x += Math.sin(t * b.speed + i) * 0.024;
        b.mesh.position.y += Math.cos(t * b.speed + i) * 0.01;
        b.mesh.rotation.z = Math.sin(t * b.speed + i) * 0.42;
        if (b.mesh.position.x > 16) b.mesh.position.x = -18;
      });

      // gentle camera auto-aim for parallax feel (slight)
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    // Resize handler
    function onResize() {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);

    // subtle pointer parallax (non-intrusive)
    window.addEventListener('mousemove', (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      camera.position.x += (nx * 0.6 - camera.position.x) * 0.04;
      camera.position.y += (-ny * 0.28 - camera.position.y) * 0.03;
      camera.lookAt(0, 0.6, 0);
    });

    // If an ip option was provided, update any IP text elements
    if (opts && typeof opts.ip === 'string') {
      document.querySelectorAll('#server-ip, #server-ip-2, .ip').forEach(el => {
        if (el.tagName.toLowerCase() === 'input') el.value = opts.ip;
        else el.textContent = opts.ip;
      });
    }

    console.log('ThreeScene started');
    return { scene, camera, renderer, container };
  };

})();
