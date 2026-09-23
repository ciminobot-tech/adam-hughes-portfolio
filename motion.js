const motionGroups = [
  ['.hero .eyebrow', '.hero h1', '.hero-bottom'],
  ['.statement .eyebrow', '.statement h2', '.statement-copy p'],
  ['.section-heading', '.project'],
  ['.capabilities .eyebrow', '.capability-grid > div'],
  ['.credentials .eyebrow', '.credentials-list'],
  ['.contact > *'],
];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (!reduceMotion.matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('motion-ready');
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
