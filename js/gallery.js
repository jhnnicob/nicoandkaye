export function initGallery() {
  const galleryItems = document.querySelectorAll('[data-gallery-item]');
  const modal = document.querySelector('[data-gallery-modal]');
  const modalImage = document.querySelector('[data-gallery-image]');
  const modalClose = document.querySelector('[data-modal-close]');

  if (!galleryItems.length || !modal || !modalImage || !modalClose) return;

  const closeModal = () => {
    modal.classList.remove('is-visible');
    document.body.classList.remove('modal-open');
  };

  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      const src = item.dataset.galleryItem;
      if (!src) return;
      modalImage.src = src;
      modal.classList.add('is-visible');
      document.body.classList.add('modal-open');
      modalClose.focus();
    });
  });

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-visible')) {
      closeModal();
    }
  });
}
