const motionGroups = [
  ['.hero .eyebrow', '.hero h1', '.hero-bottom'],
  ['.statement .eyebrow', '.statement h2', '.statement-copy p'],
  ['.section-heading'],
  ['.capabilities .eyebrow', '.capability-grid > div'],
  ['.credentials .eyebrow', '.credentials-list'],
  ['.contact > *'],
];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (!reduceMotion.matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('motion-ready');
  const projects = [...document.querySelectorAll('.project')];
  const orb = document.querySelector('.hero-orb');
  const supportsScrollTimeline = CSS.supports('animation-timeline: view()');

  projects.forEach((project) => project.querySelector('.project-image')?.classList.add('project-motion'));

  if (supportsScrollTimeline) {
    document.documentElement.classList.add('native-scroll-motion');
  } else {
    const state = projects.map((project) => ({ project, image: project.querySelector('.project-image'), y: 0, scale: 1, opacity: 1, blur: 0, targetY: 0, targetScale: 1, targetOpacity: 1, targetBlur: 0 }));
    const orbState = { y: 0, targetY: 0 };
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

      if (orb) {
        orbState.targetY = Math.min(window.scrollY * 0.16, 150);
        orbState.y += (orbState.targetY - orbState.y) * 0.09;
        orb.style.transform = `translate3d(0, ${orbState.y.toFixed(2)}px, 0)`;
        settling ||= Math.abs(orbState.targetY - orbState.y) > 0.08;
      }

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
