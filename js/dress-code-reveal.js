(() => {
  const section = document.getElementById('guest-policy');
  if (!section || !section.querySelector('.dc-botanical-layer')) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !('IntersectionObserver' in window)) return;
  let observer;
  const reveal = () => {
    section.classList.add('dc-botanical-visible');
    observer?.disconnect();
    motion.removeEventListener?.('change', onMotionChange);
  };
  const onMotionChange = (event) => { if (event.matches) reveal(); };
  try {
    observer = new IntersectionObserver((entries) => {
      if (entries.some(entry => entry.isIntersecting)) reveal();
    }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
    section.classList.add('dc-botanical-pending');
    observer.observe(section);
    motion.addEventListener?.('change', onMotionChange);
  } catch {
    section.classList.remove('dc-botanical-pending');
    observer?.disconnect();
  }
})();
