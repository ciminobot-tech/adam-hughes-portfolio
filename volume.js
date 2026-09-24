import * as THREE from 'https://unpkg.com/three@0.180.0/build/three.module.js';

const tour = document.querySelector('.volume-tour');
const canvas = document.querySelector('.volume-render');

if (tour && canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#060708');
  scene.fog = new THREE.Fog('#060708', 18, 38);
  const camera = new THREE.PerspectiveCamera(55, 1, .1, 80);
  camera.position.set(0, 1.1, 9.5);

  const ambient = new THREE.HemisphereLight('#d7e1e6', '#020303', 1.35);
  scene.add(ambient);
  const rim = new THREE.DirectionalLight('#e9f1f5', 1.5);
  rim.position.set(-7, 8, 5);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(54, 46),
    new THREE.MeshStandardMaterial({ color: '#14191b', roughness: .76, metalness: .17 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -3, -3);
  scene.add(floor);

  const coveGeometry = new THREE.CylinderGeometry(14, 14, 10, 96, 1, true, -Math.PI * .07, Math.PI * 1.14);
  const coveMaterials = [];
  const coveMeshes = [];
  const sceneImages = [
    'assets/Automotive/automotive.jpg',
    'assets/Fashion/fashion.jpg',
    'assets/Commercial/commercial.jpg',
    'assets/Branding/branding.jpg',
  ];

  const makeContainedTexture = (url) => new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const surface = document.createElement('canvas');
      surface.width = 2048; surface.height = 1024;
      const ctx = surface.getContext('2d');
      ctx.fillStyle = '#07090a'; ctx.fillRect(0, 0, surface.width, surface.height);
      const scale = Math.min(surface.width / image.width, surface.height / image.height);
      const width = image.width * scale; const height = image.height * scale;
      ctx.drawImage(image, (surface.width - width) / 2, (surface.height - height) / 2, width, height);
      const texture = new THREE.CanvasTexture(surface);
      texture.colorSpace = THREE.SRGBColorSpace;
      resolve(texture);
    };
    image.src = url;
  });

  Promise.all(sceneImages.map(makeContainedTexture)).then((textures) => {
    textures.forEach((texture, index) => {
      const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, transparent: true, opacity: index === 0 ? 1 : 0 });
      const mesh = new THREE.Mesh(coveGeometry, material);
      mesh.position.y = 2;
      mesh.renderOrder = index;
      scene.add(mesh); coveMaterials.push(material); coveMeshes.push(mesh);
    });
    render();
  });

  const assetData = [
    ['assets/Automotive/porsche-floor-cutout-v2.png', 7.3, 4.85],
    ['assets/Fashion/fashion-floor-asset-v1.png', 3.6, 5.6],
    ['assets/Commercial/taycan-floor-cutout-v3.png', 6.7, 3.35],
    ['assets/Branding/racing-driver-floor-cutout-v2.png', 3.8, 5.7],
  ];
  const assets = [];
  const loader = new THREE.TextureLoader();
  assetData.forEach(([url, width, height], index) => {
    const group = new THREE.Group();
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: .72, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.scale.set(width * .36, height * .055, 1); shadow.position.y = -2.97;
    const texture = loader.load(url); texture.colorSpace = THREE.SRGBColorSpace;
    const asset = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    asset.position.y = -3 + height / 2;
    group.add(shadow, asset); group.position.set(0, 0, 1.1); group.visible = index === 0;
    scene.add(group); assets.push(group);
  });

  let progress = 0;
  const names = ['Automotive / 01', 'Fashion / 02', 'Commercial / 03', 'Branding / 04'];
  const label = tour.querySelector('[data-tour-name]');
  const directions = [-1, 1, -1, 1];
  const smooth = (value) => value * value * (3 - 2 * value);
  const render = () => {
    const rect = tour.getBoundingClientRect();
    const travel = Math.max(1, rect.height - innerHeight);
    progress = Math.max(0, Math.min(.9999, -rect.top / travel));
    const raw = progress * 4;
    const chapter = Math.min(3, Math.floor(raw));
    const local = chapter === 3 ? 0 : smooth(raw - chapter);
    const direction = directions[chapter];
    const cameraX = local * 5.8 * direction;
    camera.position.x = cameraX;
    camera.lookAt(cameraX * .28, .55, -4.5);

    coveMaterials.forEach((material, index) => {
      material.opacity = index === chapter ? 1 - Math.max(0, (local - .48) / .42) : index === chapter + 1 ? Math.max(0, (local - .42) / .48) : 0;
    });
    assets.forEach((asset, index) => {
      const current = index === chapter;
      const incoming = index === chapter + 1;
      asset.visible = current || incoming;
      if (current) {
        asset.position.x = 0;
        asset.position.z = 1.1;
        asset.position.x -= cameraX * .12;
        asset.scale.setScalar(1 - local * .08);
      } else if (incoming) {
        asset.position.x = -direction * 5.8;
        asset.position.z = 1.1;
        asset.scale.setScalar(.92 + local * .08);
      }
    });
    if (tour.dataset.scene !== String(chapter)) {
      tour.dataset.scene = String(chapter);
      if (label) label.textContent = names[chapter];
    }
    renderer.render(scene, camera);
  };
  const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); render(); };
  window.addEventListener('scroll', () => requestAnimationFrame(render), { passive: true });
  window.addEventListener('resize', resize);
  document.documentElement.classList.add('volume-webgl');
  resize();
}
