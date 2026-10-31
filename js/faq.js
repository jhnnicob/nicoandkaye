(() => {
  const section = document.getElementById('faqs');
  if (!section) return;
  const questions = [...section.querySelectorAll('.faq-question')];
  const setExpanded = (button, expanded) => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    button.setAttribute('aria-expanded', String(expanded));
    panel.setAttribute('aria-hidden', String(!expanded));
    panel.inert = !expanded;
  };
  questions.forEach((button) => {
    button.addEventListener('click', () => {
      const shouldExpand = button.getAttribute('aria-expanded') !== 'true';
      questions.forEach((question) => setExpanded(question, question === button && shouldExpand));
    });
  });
})();
