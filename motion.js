const motionGroups = [
  ['.hero .eyebrow', '.hero h1', '.hero-bottom'],
  ['.statement .eyebrow', '.statement h2', '.statement-copy p'],
  ['.section-heading'],
  ['.capabilities .eyebrow', '.capability-grid > div'],
  ['.credentials .eyebrow', '.credentials-list'],
  ['.contact > *'],
];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const orb = document.querySelector('.hero-orb');
const volume = document.querySelector('.hero-volume');

if (volume && !reduceMotion.matches) {
  const titles = ['Automotive', 'Fashion', 'Commercial', 'Branding'];
  const title = volume.querySelector('[data-volume-title]');
  const count = volume.querySelector('[data-volume-count]');
  const ledTitle = volume.querySelector('[data-led-title]');
  const ledNumber = volume.querySelector('[data-led-number]');
  let active = -1;
  let scheduled = false;
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const renderVolume = () => {
    scheduled = false;
    const rect = volume.getBoundingClientRect();
    const travel = Math.max(1, rect.height - window.innerHeight);
    const progress = Math.max(0, Math.min(0.999, -rect.top / travel));
    const sceneProgress = progress * 4;
    const scene = Math.min(3, Math.floor(sceneProgress));
    const withinScene = sceneProgress - scene;
    volume.style.setProperty('--volume-progress', progress.toFixed(3));
    // One continuous LED volume. The camera sweeps left → right → left →
    // right while each matching poster and physical asset takes over.
    const cameraStops = [-11, 11, -11, 11];
    const next = cameraStops[Math.min(3, scene + 1)];
    const t = withinScene * withinScene * (3 - 2 * withinScene);
    const cameraX = cameraStops[scene] + (next - cameraStops[scene]) * t;
    volume.style.setProperty('--camera-x', `${cameraX.toFixed(2)}vw`);
    if (scene !== active) {
      active = scene;
      volume.dataset.volume = String(scene);
      if (title) title.textContent = titles[scene];
      if (ledTitle) ledTitle.textContent = titles[scene];
      if (ledNumber) ledNumber.textContent = `0${scene + 1}`;
      if (count) count.textContent = `0${scene + 1} / 04`;
    }
  };
  const requestVolumeRender = () => {
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(renderVolume);
    }
  };
  window.addEventListener('scroll', requestVolumeRender, { passive: true });
  window.addEventListener('resize', requestVolumeRender);
  renderVolume();
}

if (orb && !reduceMotion.matches) {
  const nodes = [...orb.querySelectorAll('[data-orb-node]')];
  const currentLabel = orb.querySelector('[data-orb-current]');
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const points = nodes.map((node) => {
    const longitude = toRadians(Number(node.dataset.longitude));
    const latitude = toRadians(Number(node.dataset.latitude));
    return { node, x: Math.cos(latitude) * Math.sin(longitude), y: Math.sin(latitude), z: Math.cos(latitude) * Math.cos(longitude) };
  });
  let rotation = { x: -8, y: 0 };
  let velocity = { x: 0, y: 0 };
  let target = null;
  let dragging = false;
  let last = null;
  let frame = null;
  let lastScroll = window.scrollY;

  const rotatePoint = (point) => {
    const yRad = toRadians(rotation.y);
    const xRad = toRadians(rotation.x);
    const x1 = point.x * Math.cos(yRad) + point.z * Math.sin(yRad);
    const z1 = -point.x * Math.sin(yRad) + point.z * Math.cos(yRad);
    return { x: x1, y: point.y * Math.cos(xRad) - z1 * Math.sin(xRad), z: point.y * Math.sin(xRad) + z1 * Math.cos(xRad) };
  };

  const renderOrb = () => {
    const radius = orb.clientWidth * 0.37;
    let foremost = points[0];
    let greatestDepth = -Infinity;
    points.forEach((point) => {
      const position = rotatePoint(point);
      const depth = (position.z + 1) / 2;
      const scale = 0.58 + depth * 0.56;
      point.node.style.transform = `translate3d(${(position.x * radius).toFixed(1)}px, ${(position.y * radius).toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      point.node.style.opacity = (0.18 + depth * 0.82).toFixed(3);
      point.node.style.zIndex = String(Math.round(depth * 100));
      point.node.classList.toggle('is-orb-active', depth > 0.955);
      point.node.style.pointerEvents = depth > 0.36 ? 'auto' : 'none';
      if (position.z > greatestDepth) { greatestDepth = position.z; foremost = point; }
    });
    if (currentLabel) currentLabel.textContent = foremost.node.textContent.replace(/^\s*\d+\s*/, '').trim();
  };

  const animate = () => {
    if (target) {
      rotation.x += (target.x - rotation.x) * 0.12;
      rotation.y += (target.y - rotation.y) * 0.12;
      if (Math.abs(target.x - rotation.x) < 0.08 && Math.abs(target.y - rotation.y) < 0.08) target = null;
    } else if (!dragging) {
      rotation.x += velocity.x;
      rotation.y += velocity.y;
      velocity.x *= 0.91;
      velocity.y *= 0.91;
      if (Math.abs(velocity.x) < 0.005) velocity.x = 0;
      if (Math.abs(velocity.y) < 0.005) velocity.y = 0;
    }
    renderOrb();
    if (dragging || target || velocity.x || velocity.y) frame = requestAnimationFrame(animate);
    else frame = null;
  };
  const requestFrame = () => { if (!frame) frame = requestAnimationFrame(animate); };
  const centreNode = (point) => {
    target = {
      y: rotation.y - Math.atan2(point.x, point.z) * 180 / Math.PI,
      x: rotation.x + Math.atan2(point.y, Math.hypot(point.x, point.z)) * 180 / Math.PI,
    };
    velocity = { x: 0, y: 0 };
    requestFrame();
  };

  orb.addEventListener('pointerdown', (event) => {
    if (event.target.closest('a')) return;
    dragging = true; target = null; velocity = { x: 0, y: 0 }; last = { x: event.clientX, y: event.clientY };
    orb.setPointerCapture(event.pointerId); orb.classList.add('is-dragging'); requestFrame();
  });
  orb.addEventListener('pointermove', (event) => {
    if (!dragging || !last) return;
    const dx = event.clientX - last.x; const dy = event.clientY - last.y;
    rotation.y += dx * 0.48; rotation.x -= dy * 0.48;
    velocity = { x: -dy * 0.075, y: dx * 0.075 }; last = { x: event.clientX, y: event.clientY };
  });
  const stopDrag = () => { if (!dragging) return; dragging = false; last = null; orb.classList.remove('is-dragging'); requestFrame(); };
  orb.addEventListener('pointerup', stopDrag); orb.addEventListener('pointercancel', stopDrag);
  nodes.forEach((node, index) => node.addEventListener('click', () => centreNode(points[index])));
  window.addEventListener('scroll', () => {
    const delta = window.scrollY - lastScroll; lastScroll = window.scrollY;
    if (Math.abs(delta) < 1) return;
    rotation.x -= delta * 0.07; velocity.x = -delta * 0.018; requestFrame();
  }, { passive: true });
  window.addEventListener('resize', renderOrb);
  renderOrb();
}

if (!reduceMotion.matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('motion-ready');
  const projects = [...document.querySelectorAll('.project')];
  const supportsScrollTimeline = CSS.supports('animation-timeline: view()');

  projects.forEach((project) => project.querySelector('.project-image')?.classList.add('project-motion'));

  if (supportsScrollTimeline) {
    document.documentElement.classList.add('native-scroll-motion');
  } else {
    const state = projects.map((project) => ({ project, image: project.querySelector('.project-image'), y: 0, scale: 1, opacity: 1, blur: 0, targetY: 0, targetScale: 1, targetOpacity: 1, targetBlur: 0 }));
    let running = false;

    const render = () => {
      let settling = false;
      const viewportCenter = window.innerHeight * 0.5;

      state.forEach((item) => {
        const rect = item.project.getBoundingClientRect();
        const distance = Math.max(-1, Math.min(1, (rect.top + rect.height * 0.5 - item.y - viewportCenter) / window.innerHeight));
        item.targetY = distance * -126;
        item.targetScale = 1.04 + Math.abs(distance) * 0.16;
        item.targetOpacity = 1 - Math.abs(distance) * 0.3;
        item.targetBlur = Math.abs(distance) * 5;
        item.y += (item.targetY - item.y) * 0.11;
        item.scale += (item.targetScale - item.scale) * 0.11;
        item.opacity += (item.targetOpacity - item.opacity) * 0.11;
        item.blur += (item.targetBlur - item.blur) * 0.11;
        if (item.image) {
          item.image.style.transform = `translate3d(0, ${item.y.toFixed(2)}px, 0) scale(${item.scale.toFixed(4)})`;
          item.image.style.opacity = item.opacity.toFixed(3);
          item.image.style.filter = `blur(${item.blur.toFixed(2)}px)`;
        }
        settling ||= Math.abs(item.targetY - item.y) > 0.08 || Math.abs(item.targetScale - item.scale) > 0.0002 || Math.abs(item.targetOpacity - item.opacity) > 0.002 || Math.abs(item.targetBlur - item.blur) > 0.04;
      });

      if (settling) {
        window.requestAnimationFrame(render);
      } else {
        running = false;
      }
    };

    const requestRender = () => {
      if (!running) {
        running = true;
        window.requestAnimationFrame(render);
      }
    };

    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', requestRender);
    requestRender();
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -7% 0px' },
  );

  motionGroups.forEach((group) => {
    let delay = 0;
    group.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        element.classList.add('reveal');
        element.style.setProperty('--reveal-delay', `${delay}ms`);
        delay += 80;
        observer.observe(element);
      });
    });
  });
}
