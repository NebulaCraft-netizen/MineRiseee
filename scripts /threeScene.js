(function(){
  const THREE_CDN = 'https://unpkg.com/three@0.152.2/build/three.min.js';
  function loadScript(src){ return new Promise((res,rej)=>{ if(document.querySelector('script[src="'+src+'"]')) return res(); const s=document.createElement('script'); s.src=src; s.async=true; s.onload=()=>res(); s.onerror=(e)=>rej(e); document.head.appendChild(s); }); }

  window.initThree = window.initThree || (async function initThree(opts = {}){
    if (typeof window.THREE === 'undefined') {
      try { await loadScript(THREE_CDN); } catch(e){ console.warn('three load failed', e); return; }
    }
    const THREE = window.THREE;
    if (!THREE) return;

    let container = document.getElementById('three-container');
    if (!container) { container = document.createElement('div'); container.id = 'three-container'; document.body.appendChild(container); }
    if (container.__initialized) return; container.__initialized = true;

    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.position='fixed'; renderer.domElement.style.inset='0'; renderer.domElement.style.zIndex='0'; renderer.domElement.style.pointerEvents='none';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 2000);
    camera.position.set(0, 2.3, 7);

    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffb86b, 0.9); dir.position.set(5,10,5); scene.add(dir);
    const rim = new THREE.DirectionalLight(0xffffff, 0.12); rim.position.set(-5,4,-6); scene.add(rim);

    function makePumpkinCanvasTexture(color='#ff8a2b'){
      const w = 512, h = 512;
      const cvs = document.createElement('canvas');
      cvs.width = w; cvs.height = h;
      const ctx = cvs.getContext('2d');

      const g = ctx.createLinearGradient(0,0,w, h);
      g.addColorStop(0, '#ffd2a0');
      g.addColorStop(0.3, color);
      g.addColorStop(1, '#8b3b08');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,w,h);

      ctx.globalAlpha = 0.06;
      for(let i=0;i<160;i++){
        const x = (i / 160) * w + Math.sin(i)*2;
        ctx.fillStyle = i%2 ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)';
        ctx.fillRect(x - 2, 0, 8, h);
      }
      ctx.globalAlpha = 1;

      const id = ctx.getImageData(0,0,w,h);
      for (let i = 0; i < id.data.length; i += 4) {
        const v = (Math.random() - 0.5) * 14;
        id.data[i] = Math.max(0, Math.min(255, id.data[i] + v));
        id.data[i+1] = Math.max(0, Math.min(255, id.data[i+1] + v * 0.5));
        id.data[i+2] = Math.max(0, Math.min(255, id.data[i+2] + v * 0.2));
      }
      ctx.putImageData(id, 0, 0);

      const tex = new THREE.CanvasTexture(cvs);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1,1);
      tex.encoding = THREE.sRGBEncoding;
      return tex;
    }

    function makeRealPumpkin(scale = 1, color = 0xff8a2b) {
      const pts = [];
      const height = 1.6 * scale;
      const half = height / 2;
      const segments = 28;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const y = -half + t * height;
        const baseR = 0.95 * scale * (0.4 + 0.8 * Math.sin(Math.PI * t));
        const ridge = 0.12 * scale * Math.cos(t * Math.PI * 6) * (1 - Math.abs(t - 0.5) * 1.6);
        const r = Math.max(0.12 * scale, baseR + ridge);
        pts.push(new THREE.Vector2(r, y));
      }

      const geo = new THREE.LatheGeometry(pts, 64);
      const pos = geo.attributes.position;
      const vCount = pos.count;
      for (let i = 0; i < vCount; i++){
        const nx = (Math.random() - 0.5) * 0.01 * scale;
        const ny = (Math.random() - 0.5) * 0.01 * scale;
        const nz = (Math.random() - 0.5) * 0.01 * scale;
        pos.setXYZ(i, pos.getX(i) + nx, pos.getY(i) + ny, pos.getZ(i) + nz);
      }
      geo.computeVertexNormals();

      const colorHex = '#' + color.toString(16).padStart(6,'0');
      const map = makePumpkinCanvasTexture(colorHex);
      const mat = new THREE.MeshStandardMaterial({
        map: map,
        roughness: 0.7,
        metalness: 0.02,
        envMapIntensity: 0.2,
        side: THREE.FrontSide
      });

      const pumpkin = new THREE.Mesh(geo, mat);
      pumpkin.castShadow = true;
      pumpkin.receiveShadow = true;

      const stemGeo = new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.36 * scale, 10);
      stemGeo.translate(0, half + 0.18*scale, 0);
      const sPos = stemGeo.attributes.position;
      for (let i = 0; i < sPos.count; i++){
        const px = sPos.getX(i), py = sPos.getY(i), pz = sPos.getZ(i);
        const t = (py - (half + 0.18*scale)) / (0.36*scale);
        const ang = t * 2.2;
        const rx = px * Math.cos(ang) - pz * Math.sin(ang);
        const rz = px * Math.sin(ang) + pz * Math.cos(ang);
        sPos.setXYZ(i, rx, py, rz);
      }
      stemGeo.computeVertexNormals();
      const stemMat = new THREE.MeshStandardMaterial({ color:0x3b2b18, roughness:0.6, metalness:0.05 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      pumpkin.add(stem);

      const faceGroup = new THREE.Group();
      function makeEye(w,h, x, y, z, rot=0){
        const shape = new THREE.Shape();
        shape.moveTo(0,0);
        shape.lineTo(w/2, h);
        shape.lineTo(-w/2, h);
        shape.closePath();
        const geo = new THREE.ShapeGeometry(shape);
        geo.translate(x, y, z - 0.02*scale);
        const mat = new THREE.MeshStandardMaterial({ color:0x0b0b0b, roughness:0.95, metalness:0 });
        const m = new THREE.Mesh(geo, mat);
        m.rotation.z = rot;
        return m;
      }
      function makeMouth(w,h, x,y,z){
        const shape = new THREE.Shape();
        const hw = w/2, hh = h/2;
        shape.moveTo(-hw, 0);
        shape.bezierCurveTo(-hw * 0.6, hh*0.6, hw * 0.6, hh*0.6, hw, 0);
        shape.lineTo(hw, -hh*0.4);
        shape.bezierCurveTo(hw * 0.6, hh*0.2, -hw * 0.6, hh*0.2, -hw, -hh*0.4);
        shape.closePath();
        const geo = new THREE.ShapeGeometry(shape);
        geo.translate(x, y, z - 0.02*scale);
        const mat = new THREE.MeshStandardMaterial({ color:0x0b0b0b, roughness:0.95, metalness:0 });
        const m = new THREE.Mesh(geo, mat);
        return m;
      }

      const eyeL = makeEye(0.22*scale, 0.28*scale, -0.35*scale, 0.15*scale, 0.9*scale);
      const eyeR = makeEye(0.22*scale, 0.28*scale, 0.35*scale, 0.15*scale, 0.9*scale, Math.PI*0.02);
      const mouth = makeMouth(0.9*scale, 0.28*scale, 0, -0.25*scale, 0.9*scale);

      faceGroup.add(eyeL, eyeR, mouth);

      const glowMat = new THREE.MeshStandardMaterial({ color: 0xff8a2b, emissive: 0xff7b2a, emissiveIntensity: 0.9, roughness: 1, metalness: 0 });
      const inner = new THREE.Mesh(new THREE.SphereGeometry(0.18*scale, 8, 6), glowMat);
      inner.position.set(0, -0.05*scale, 0.55*scale);
      inner.material.transparent = true;
      inner.material.opacity = 0.95;

      const pointLight = new THREE.PointLight(0xffa84d, 0.9, 3*scale, 2);
      pointLight.position.set(0, 0, 0.6*scale);

      pumpkin.add(faceGroup);
      pumpkin.add(inner);
      pumpkin.add(pointLight);

      const pivot = new THREE.Group();
      pivot.add(pumpkin);

      return { group: pivot, mesh: pumpkin, innerLight: pointLight };
    }

    const pumpkins = [];
    const basePositions = [
      [-2.6, 0.4, -2],
      [-0.6, 0.35, -1.5],
      [1.2, 0.5, -2.2],
      [3.0, 0.45, -1.8],
      [0.9, 0.3, -3.2],
    ];
    basePositions.forEach((p, i) => {
      const scale = 0.9 + Math.random()*0.9;
      const color = 0xff8a2b - Math.floor(Math.random()*0x112233);
      const pObj = makeRealPumpkin(scale, color);
      pObj.group.position.set(p[0], p[1], p[2]);
      pObj.group.rotation.y = Math.random() * Math.PI * 2;
      pObj.innerLight.intensity = 0.6 + Math.random()*0.9;
      scene.add(pObj.group);
      pumpkins.push(pObj);
    });

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60,60), new THREE.MeshStandardMaterial({ color:0x050406, roughness:1 }));
    ground.rotation.x = -Math.PI/2;
    ground.position.y = -1.2;
    scene.add(ground);

    let time = 0;
    function animate(){
      time += 0.01;
      pumpkins.forEach((pObj, i) => {
        const m = pObj.mesh;
        pObj.group.rotation.y += 0.0008 + Math.sin(time*0.2 + i) * 0.0006;
        m.rotation.z = Math.sin(time*0.5 + i) * 0.02;
        m.position.y = Math.sin(time*0.4 + i) * 0.03;
        pObj.innerLight.intensity = 0.6 + 0.4 * Math.abs(Math.sin(time*0.6 + i));
      });
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', ()=>{ renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); });
    return { renderer, scene, camera };
  });

})();
