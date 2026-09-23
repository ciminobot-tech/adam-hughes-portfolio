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
  let framePending = false;

  const updateScrollMotion = () => {
    const viewportCenter = window.innerHeight * 0.5;
    projects.forEach((project) => {
      const rect = project.getBoundingClientRect();
      const projectCenter = rect.top + rect.height * 0.5;
      const distance = Math.max(-1, Math.min(1, (projectCenter - viewportCenter) / window.innerHeight));
      const shift = Math.round(distance * -24);
      const scale = (1 - Math.abs(distance) * 0.012).toFixed(3);
      project.style.setProperty('--project-shift', `${shift}px`);
      project.style.setProperty('--project-scale', scale);
    });

    if (orb) {
      orb.style.setProperty('--orb-shift', `${Math.min(window.scrollY * 0.09, 90)}px`);
    }
    framePending = false;
  };

  const requestScrollMotion = () => {
    if (!framePending) {
      window.requestAnimationFrame(updateScrollMotion);
      framePending = true;
    }
  };

  projects.forEach((project) => project.classList.add('project-motion'));
  window.addEventListener('scroll', requestScrollMotion, { passive: true });
  window.addEventListener('resize', requestScrollMotion);
  requestScrollMotion();

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
