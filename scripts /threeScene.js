// scripts/threeScene.js
// Improved pumpkin scene + robust loader
(function () {
  const THREE_CDN = 'https://unpkg.com/three@0.152.2/build/three.min.js';
  const RETRY_CDN = 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js';

  function loadScript(src, timeout = 8000) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src="' + src + '"]')) {
        console.log('[threeScene] script already present:', src);
        return resolve();
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => {
        console.log('[threeScene] loaded script:', src);
        resolve();
      };
      s.onerror = (e) => {
        console.warn('[threeScene] failed to load script:', src, e);
        reject(e);
      };
      document.head.appendChild(s);

      // simple timeout guard
      setTimeout(() => {
        reject(new Error('script load timeout ' + src));
      }, timeout);
    });
  }

  async function ensureThree() {
    if (typeof window.THREE !== 'undefined') {
      return;
    }
    try {
      await loadScript(THREE_CDN);
    } catch (err) {
      console.warn('[threeScene] primary CDN failed, retrying jsdelivr...', err);
      try {
        await loadScript(RETRY_CDN);
      } catch (err2) {
        console.error('[threeScene] both three.js CDNs failed', err2);
        throw err2;
      }
    }
  }

  function canUseWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  window.initThree = window.initThree || (async function initThree(opts = {}) {
    if (!canUseWebGL()) {
      console.warn('[threeScene] WebGL not available in this browser/environment');
      return null;
    }

    await ensureThree();
    const THREE = window.THREE;
    if (!THREE) {
      console.error('[threeScene] THREE not found after load');
      return null;
    }

    console.log('[threeScene] initializing scene...');

    // get or create container
    let container = document.getElementById('three-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'three-container';
      document.body.appendChild(container);
    }
    // prevent double init
    if (container.__initialized) {
      console.log('[threeScene] already initialized, skipping');
      return container.__instance || null;
    }
    container.__initialized = true;

    // renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    // transparent so your page content shows above
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.zIndex = '0';
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    // scene + camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 1.8, 6.5);

    // lights: hemisphere + ambient + directional + subtle fill
    const hemi = new THREE.HemisphereLight(0x443355, 0x0a0202, 0.35);
    scene.add(hemi);
    const ambient = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffb86b, 0.9);
    dir.position.set(5, 10, 6);
    dir.castShadow = false;
    scene.add(dir);

    const fill = new THREE.DirectionalLight(0x88b7ff, 0.12);
    fill.position.set(-6, 2, -4);
    scene.add(fill);

    // helper: pumpkin texture generator (canvas)
    function makePumpkinCanvasTexture(baseHex = '#ff8a2b') {
      const w = 512, h = 512;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');

      // smooth vertical gradient
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#ffd2a0');
      g.addColorStop(0.4, baseHex);
      g.addColorStop(1, '#8b3b08');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // subtle ridges, vertical stripes
      ctx.globalAlpha = 0.06;
      for (let i = 0; i < 120; i++) {
        const x = (i / 120) * w + Math.sin(i * 0.6) * 3;
        ctx.fillStyle = i % 2 ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)';
        ctx.fillRect(x - 3, 0, 6, h);
      }
      ctx.globalAlpha = 1;

      // add grain/noise
      const id = ctx.getImageData(0, 0, w, h);
      for (let i = 0; i < id.data.length; i += 4) {
        const v = (Math.random() - 0.5) * 8;
        id.data[i] = Math.max(0, Math.min(255, id.data[i] + v));
        id.data[i + 1] = Math.max(0, Math.min(255, id.data[i + 1] + v * 0.6));
        id.data[i + 2] = Math.max(0, Math.min(255, id.data[i + 2] + v * 0.2));
      }
      ctx.putImageData(id, 0, 0);

      const tex = new THREE.CanvasTexture(c);
      tex.encoding = THREE.sRGBEncoding;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 1);
      return tex;
    }

    // function to create a 'real' pumpkin (lathe + stem + carved face)
    function makeRealPumpkin(scale = 1, color = 0xff8a2b) {
      // profile for LatheGeometry
      const points = [];
      const height = 1.5 * scale;
      const half = height / 2;
      const segments = 32;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const y = -half + t * height;
        // base radius curve for pumpkin belly
        const base = 0.9 * scale * (0.35 + 0.85 * Math.sin(Math.PI * t));
        // small ridges
        const ridge = 0.14 * scale * Math.cos(t * Math.PI * 6) * (1 - Math.abs(t - 0.5) * 1.4);
        const r = Math.max(0.12 * scale, base + ridge);
        points.push(new THREE.Vector2(r, y));
      }

      const geo = new THREE.LatheGeometry(points, 64);
      // small vertex jitter to avoid perfectly smooth sphere look
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 0.005 * scale);
        pos.setY(i, pos.getY(i) + (Math.random() - 0.5) * 0.002 * scale);
        pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 0.005 * scale);
      }
      geo.computeVertexNormals();

      const texture = makePumpkinCanvasTexture('#' + color.toString(16).padStart(6, '0'));
      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.72,
        metalness: 0.02,
        envMapIntensity: 0.15
      });

      const pumpkin = new THREE.Mesh(geo, mat);
      pumpkin.castShadow = true;
      pumpkin.receiveShadow = true;

      // stem
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.36 * scale, 10),
        new THREE.MeshStandardMaterial({ color: 0x3b2b18, roughness: 0.6, metalness: 0.03 })
      );
      stem.position.y = half + (0.18 * scale);
      stem.rotation.x = 0.15;
      pumpkin.add(stem);

      // carved face (flat black shapes slightly inset)
      const faceGroup = new THREE.Group();

      function carvedTriangle(w, h, x, y, z, rot = 0) {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(w / 2, h);
        shape.lineTo(-w / 2, h);
        shape.closePath();
        const g = new THREE.ShapeGeometry(shape);
        g.translate(x, y, z - 0.02 * scale); // slightly out/in front
        const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.95 }));
        m.rotation.z = rot;
        return m;
      }

      function carvedMouth(w, h, x, y, z) {
        const shape = new THREE.Shape();
        const hw = w / 2, hh = h / 2;
        shape.moveTo(-hw, 0);
        shape.bezierCurveTo(-hw * 0.6, hh * 0.7, hw * 0.6, hh * 0.7, hw, 0);
        shape.lineTo(hw, -hh * 0.4);
        shape.bezierCurveTo(hw * 0.6, hh * 0.2, -hw * 0.6, hh * 0.2, -hw, -hh * 0.4);
        shape.closePath();
        const g = new THREE.ShapeGeometry(shape);
        g.translate(x, y, z - 0.02 * scale);
        const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x080808, roughness: 0.96 }));
        return m;
      }

      const eyeL = carvedTriangle(0.22 * scale, 0.28 * scale, -0.34 * scale, 0.12 * scale, 0.9 * scale, -0.05);
      const eyeR = carvedTriangle(0.22 * scale, 0.28 * scale, 0.34 * scale, 0.12 * scale, 0.9 * scale, 0.05);
      const mouth = carvedMouth(0.9 * scale, 0.26 * scale, 0, -0.25 * scale, 0.9 * scale);

      faceGroup.add(eyeL, eyeR, mouth);

      // internal emissive "light" sphere to simulate candle/led inside the pumpkin
      const innerGeom = new THREE.SphereGeometry(0.16 * scale, 8, 6);
      const innerMat = new THREE.MeshStandardMaterial({ color: 0xffa84d, emissive: 0xff7b2a, emissiveIntensity: 1.0, roughness: 1, metalness: 0 });
      const inner = new THREE.Mesh(innerGeom, innerMat);
      inner.position.set(0, -0.05 * scale, 0.55 * scale);

      // point light inside
      const light = new THREE.PointLight(0xffb86b, 0.9, 3 * scale, 2);
      light.position.set(0, 0, 0.6 * scale);

      pumpkin.add(faceGroup);
      pumpkin.add(inner);
      pumpkin.add(light);

      // pivot group for easy animation
      const group = new THREE.Group();
      group.add(pumpkin);

      return { group, pumpkin, innerLight: light };
    }

    // create multiple pumpkins in the scene
    const pumpkins = [];
    const basePositions = [
      [-2.6, 0.32, -2.0],
      [-0.6, 0.28, -1.6],
      [1.2, 0.42, -2.2],
      [3.0, 0.35, -1.8],
      [0.9, 0.22, -3.0]
    ];

    basePositions.forEach((p, i) => {
      const s = 0.8 + Math.random() * 0.9;
      const color = 0xff8a2b - Math.floor(Math.random() * 0x003322);
      const pObj = makeRealPumpkin(s, color);
      pObj.group.position.set(p[0], p[1], p[2]);
      pObj.group.rotation.y = Math.random() * Math.PI * 2;
      pObj.innerLight.intensity = 0.5 + Math.random() * 0.9;
      scene.add(pObj.group);
      pumpkins.push(pObj);
    });

    // ground plane so there's a visible floor
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x020204, roughness: 1 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.25;
    scene.add(ground);

    // small subtle environment: distant fog color already set by scene.fog is optional

    let t = 0;
    function animate() {
      t += 0.012;
      pumpkins.forEach((pObj, i) => {
        // gentle bob + rotate + light flicker
        const bob = Math.sin(t * (0.5 + i * 0.07)) * 0.03;
        pObj.group.position.y = (basePositions[i][1]) + bob;
        pObj.group.rotation.y += 0.002 + Math.sin(t * 0.8 + i) * 0.002;
        pObj.pumpkin.rotation.z = Math.sin(t * 0.65 + i) * 0.02;
        // flicker inner light
        pObj.innerLight.intensity = 0.5 + 0.5 * Math.abs(Math.sin(t * (1.0 + i * 0.3)));
      });
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    // responsive
    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });

    // store instance
    container.__instance = { renderer, scene, camera };
    console.log('[threeScene] init complete');
    return container.__instance;
  });

  // Try to init automatically after DOM loaded (two attempts to be safe)
  function startInit() {
    if (typeof window.initThree === 'function') {
      try {
        window.initThree().catch?.(e => console.warn('[threeScene] initThree rejected', e));
      } catch (e) {
        console.warn('[threeScene] initThree thrown', e);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(startInit, 250));
  } else {
    setTimeout(startInit, 250);
  }

  // also try again later (in case CDN was slow)
  setTimeout(() => {
    startInit();
  }, 1500);

})();
