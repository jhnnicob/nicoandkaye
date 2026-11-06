const thumbnailFilenames = [
  'thumbnail3.jpg',
  'thumbnail1.jpg',
  'gallery011.jpg',
  'thumbnail5.jpg',
];

const additionalFilenames = [
  'img1.jpg',
  'img2.jpg',
  'img3.jpg',
  'img4.jpg',
  'img5.jpg',
  'img6.jpg',
  'img7.jpg',
  'MM-115.jpg',
  'MM-118.jpg',
  'MM-122.jpg',
  'MM-132.jpg',
  'MM-136.jpg',
  'MM-139.jpg',
  'MM-140.jpg',
  'MM-141.jpg',
  'MM-146.jpg',
  'MM-149.jpg',
  'MM-155.jpg',
  'MM-174.jpg',
  'MM-181.jpg',
  'MM-185.jpg',
  'MM-195.jpg',
  'MM-215.jpg',
  'MM-217.jpg',
  'MM-22.jpg',
  'MM-228.jpg',
  'MM-23.jpg',
  'MM-231.jpg',
  'MM-24.jpg',
  'MM-256.jpg',
  'MM-259.jpg',
  'MM-263.jpg',
  'MM-266.jpg',
  'MM-27.jpg',
  'MM-273.jpg',
  'MM-28.jpg',
  'MM-286.jpg',
  'MM-287.jpg',
  'MM-29.jpg',
  'MM-293.jpg',
  'MM-30.jpg',
  'MM-317.jpg',
  'MM-32.jpg',
  'MM-33.jpg',
  'MM-331.jpg',
  'MM-339.jpg',
  'MM-34.jpg',
  'MM-35.jpg',
  'MM-362.jpg',
  'MM-376.jpg',
  'MM-383.jpg',
  'MM-397.jpg',
  'MM-409.jpg',
  'MM-412.jpg',
  'MM-421.jpg',
  'MM-424.jpg',
  'MM-440.jpg',
  'MM-441.jpg',
  'MM-445.jpg',
  'MM-456.jpg',
  'MM-457.jpg',
  'MM-491.jpg',
  'MM-64.jpg',
  'MM-69.jpg',
  'MM-82.jpg',
  'MM-86.jpg',
  'MM-95.jpg',
];

const thumbnailImages = thumbnailFilenames
  .map((filename) => ({ filename, source: `assets/gallery/previews/${filename}` }));

const additionalImages = additionalFilenames
  .slice()
  .sort((first, second) => first.localeCompare(second, 'en', { numeric: true, sensitivity: 'base' }))
  .map((filename) => ({ filename, source: `assets/gallery/previews/${filename}` }));
const galleryImages = [...thumbnailImages, ...additionalImages];
const galleryGrid = document.querySelector('[data-gallery-grid]');
const moreGalleryGrid = document.querySelector('[data-gallery-more-grid]');
const moreDialog = document.querySelector('[data-gallery-more-dialog]');
const morePages = document.querySelector('[data-more-pages]');
const moreCount = document.querySelector('[data-more-count]');
const moreBook = document.querySelector('[data-more-book]');
const morePreviousButton = document.querySelector('[data-more-previous]');
const moreNextButton = document.querySelector('[data-more-next]');
const moreButton = document.querySelector('[data-gallery-more]');

if (
  galleryGrid &&
  moreGalleryGrid &&
  moreDialog instanceof HTMLDialogElement &&
  morePages &&
  moreCount &&
  moreBook &&
  morePreviousButton &&
  moreNextButton &&
  moreButton &&
  galleryImages.length
) {
  const createPhotoMarkup = (image, index, isFeatured = false, isClosingWide = false) => `
        <button
          class="gallery-photo${isFeatured ? ' gallery-photo--featured' : ''}${image.filename === 'thumbnail2.jpg' ? ' gallery-photo--wide-crop' : ''}${isClosingWide ? ' gallery-photo--closing-wide' : ''}"
          type="button"
          data-gallery-index="${index}"
          aria-label="Open photo ${index + 1}"
        >
          <img src="${image.source}" alt="Nico and Kaye, photo ${index + 1}" loading="${index === 0 ? 'eager' : 'lazy'}" />
        </button>`;

  galleryGrid.innerHTML = thumbnailImages
    .map((image, index) => createPhotoMarkup(image, index, index === 0, index === thumbnailImages.length - 1))
    .join('');

  let moreIndex = 0;
  let pageFlipBusy = false;
  const imageCache = new Map();
  let pageFlip = null;
  let albumPointer = null;
  let suppressPhotoClickUntil = 0;
  let readyPhotoIndex = -1;
  let pendingWrapPage = null;
  let preloadSequence = 0;

  const pageItems = [
    { image: galleryImages[galleryImages.length - 1], index: galleryImages.length - 1, edge: 'previous' },
    ...galleryImages.map((image, index) => ({ image, index, edge: '' })),
    { image: galleryImages[0], index: 0, edge: 'next' },
  ];
  morePages.innerHTML = pageItems.map(({ image, index, edge }) => `
    <div class="gallery-more-slideshow__page" data-density="soft" data-more-photo-page="${index}"${edge ? ` data-wrap-page="${edge}" aria-hidden="true"` : ''}>
      <button class="gallery-more-slideshow__photo-button" type="button" data-more-photo="${index}" aria-label="Turn album page from photo ${index + 1}"${edge ? ' tabindex="-1"' : ''}>
        <img data-src="${image.source}" alt="Nico and Kaye, photo ${index + 1}" decoding="async" draggable="false" />
      </button>
    </div>`).join('');

  const preloadPhoto = (index) => {
    const normalizedIndex = (index + galleryImages.length) % galleryImages.length;
    const image = galleryImages[normalizedIndex];
    if (!imageCache.has(image.source)) {
      const preload = new Image();
      const loaded = new Promise((resolve, reject) => {
        preload.addEventListener('load', resolve, { once: true });
        preload.addEventListener('error', () => reject(new Error(`Unable to load gallery photo: ${image.source}`)), { once: true });
      });
      preload.src = image.source;
      const request = loaded.then(() => preload.decode()).then(() => preload).catch((error) => {
        // Failed requests must not stay cached, so the next arrow click can retry.
        if (imageCache.get(image.source) === request) imageCache.delete(image.source);
        throw error;
      });
      imageCache.set(image.source, request);
    }
    return imageCache.get(image.source);
  };

  const releaseDistantPhotos = (index) => {
    const nearby = new Set([-2, -1, 0, 1, 2].map((offset) =>
      (index + offset + galleryImages.length) % galleryImages.length));
    const sources = new Set([...nearby].map((photoIndex) => galleryImages[photoIndex].source));
    for (const source of imageCache.keys()) {
      if (!sources.has(source)) imageCache.delete(source);
    }
    morePages.querySelectorAll('[data-more-photo-page]').forEach((page) => {
      if (!nearby.has(Number(page.dataset.morePhotoPage))) {
        page.querySelector('img').removeAttribute('src');
      }
    });
  };

  const preloadNeighbors = async (index) => {
    const sequence = ++preloadSequence;
    readyPhotoIndex = -1;
    releaseDistantPhotos(index);
    const neighbors = [index - 1, index, index + 1];
    try {
      await Promise.all(neighbors.map(async (photoIndex) => {
        const normalizedIndex = (photoIndex + galleryImages.length) % galleryImages.length;
        await preloadPhoto(normalizedIndex);
        if (!moreDialog.open || sequence !== preloadSequence) return;
        // Decode the actual page images as well as the network preloads.
        await Promise.all(Array.from(morePages.querySelectorAll(
          `[data-more-photo-page="${normalizedIndex}"] img`
        ), async (image) => {
          image.src = image.dataset.src;
          await image.decode();
        }));
      }));
      if (moreDialog.open && moreIndex === index && sequence === preloadSequence) {
        readyPhotoIndex = index;
        moreCount.textContent = `${moreIndex + 1} / ${galleryImages.length}`;
      }
    } catch (error) {
      console.error(error);
      if (moreDialog.open && sequence === preloadSequence) {
        moreCount.textContent = 'Photo could not load. Tap an arrow to retry.';
      }
    }
  };

  const showMorePhoto = (index) => {
    moreIndex = (index + galleryImages.length) % galleryImages.length;
    moreCount.textContent = `${moreIndex + 1} / ${galleryImages.length}`;
    moreBook.setAttribute('aria-label', `Photo album, photo ${moreIndex + 1} of ${galleryImages.length}`);
    preloadNeighbors(moreIndex);
  };

  const updateMorePhotoIndex = (pageIndex) => {
    if (pageIndex === 0) {
      showMorePhoto(galleryImages.length - 1);
      pendingWrapPage = galleryImages.length;
      return;
    }
    if (pageIndex === galleryImages.length + 1) {
      showMorePhoto(0);
      pendingWrapPage = 1;
      return;
    }
    // Initialization and resizing can report an edge page before the real page.
    // A subsequent real page must discard that temporary wrap target.
    pendingWrapPage = null;
    showMorePhoto(pageIndex - 1);
  };

  const initializePageFlip = async () => {
    if (pageFlip) return;
    if (!window.St || !window.St.PageFlip) {
      throw new Error('StPageFlip failed to load; the photo album cannot initialize.');
    }

    await preloadNeighbors(moreIndex);
    if (!moreDialog.open || pageFlip) return;
    // Mount the engine on the page container, keeping the count outside its layers.
    const pages = Array.from(morePages.children);
    const initialPage = moreIndex + 1;
    pageFlip = new window.St.PageFlip(morePages, {
      width: 360,
      height: 480,
      size: 'stretch',
      minWidth: 360,
      maxWidth: 720,
      minHeight: 133,
      maxHeight: 960,
      flippingTime: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 780,
      drawShadow: true,
      maxShadowOpacity: 0.32,
      usePortrait: true,
      startPage: initialPage,
      autoSize: false,
      showCover: false,
      mobileScrollSupport: false,
      swipeDistance: 18,
      clickEventForward: true,
      useMouseEvents: false,
      showPageCorners: false,
      // Native mouse handling is disabled above. Keep programmatic turns enabled:
      // the corner-only restriction also blocks flipPrev() in portrait mode.
      disableFlipByClick: false,
    });
    pageFlip.on('flip', (event) => updateMorePhotoIndex(Number(event.data)));
    pageFlip.on('changeState', (event) => {
      pageFlipBusy = event.data !== 'read';
      moreBook.setAttribute('aria-busy', String(pageFlipBusy));
      // Never reset the spread while the engine is still drawing the fold.
      if (!pageFlipBusy && pendingWrapPage !== null) {
        const target = pendingWrapPage;
        pendingWrapPage = null;
        window.requestAnimationFrame(() => {
          if (pageFlip.getState() === 'read') pageFlip.turnToPage(target);
        });
      }
    });
    pageFlip.loadFromHTML(pages);
    // Keep one full-width page instead of two narrow pages, including on phones
    // smaller than the engine's portrait breakpoint.
    morePages.style.minWidth = '0';
    pageFlip.update();
    // The engine can align its initial spread to an even page. Explicitly select
    // the requested photo after mounting so thumbnail links stay exact.
    pageFlip.turnToPage(initialPage);
  };

  const turnMorePhoto = async (direction) => {
    if (!pageFlip || pageFlipBusy || galleryImages.length < 2) return;
    const targetIndex = (moreIndex + direction + galleryImages.length) % galleryImages.length;
    pageFlipBusy = true;
    moreBook.setAttribute('aria-busy', 'true');
    try {
      await preloadNeighbors(moreIndex);
      if (!moreDialog.open || readyPhotoIndex !== moreIndex) return;
      await preloadPhoto(targetIndex);
      pageFlipBusy = false;
      moreBook.removeAttribute('aria-busy');
      if (direction > 0) pageFlip.flipNext('top');
      else pageFlip.flipPrev('top');
    } catch (error) {
      console.error(error);
    } finally {
      pageFlipBusy = pageFlip.getState() !== 'read';
      moreBook.setAttribute('aria-busy', String(pageFlipBusy));
    }
  };

  const openAlbum = (index) => {
    showMorePhoto(index);
    if (!moreDialog.open) moreDialog.showModal();
    document.body.classList.add('gallery-album-open');
    if (pageFlip) pageFlip.turnToPage(moreIndex + 1);
    else window.requestAnimationFrame(() => {
      void initializePageFlip().catch(() => {
        moreCount.textContent = 'The album could not load. Please close it and try again.';
      });
    });
  };

  galleryGrid.addEventListener('click', (event) => {
    const photo = event.target.closest('[data-gallery-index]');
    if (photo) openAlbum(Number(photo.dataset.galleryIndex));
  });
  moreButton.addEventListener('click', () => openAlbum(thumbnailImages.length));
  moreDialog.addEventListener('close', () => {
    document.body.classList.remove('gallery-album-open');
    albumPointer = null;
    ++preloadSequence;
    readyPhotoIndex = -1;
    imageCache.clear();
    morePages.querySelectorAll('img').forEach((image) => image.removeAttribute('src'));
  });
  moreDialog.addEventListener('click', (event) => {
    if (event.target === moreDialog) moreDialog.close();
  });
  morePreviousButton.addEventListener('click', () => turnMorePhoto(-1));
  moreNextButton.addEventListener('click', () => turnMorePhoto(1));
  const albumPoint = (event) => {
    const rect = pageFlip.getUI().getDistElement().getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  moreBook.addEventListener('pointerdown', (event) => {
    if (!pageFlip || pageFlipBusy || readyPhotoIndex !== moreIndex ||
        !event.isPrimary || event.button !== 0) return;
    albumPointer = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    pageFlip.startUserTouch(albumPoint(event));
    moreBook.setPointerCapture(event.pointerId);
  });
  moreBook.addEventListener('pointermove', (event) => {
    if (!albumPointer || albumPointer.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - albumPointer.x, event.clientY - albumPointer.y) > 6) {
      albumPointer.moved = true;
    }
    if (albumPointer.moved) {
      event.preventDefault();
      pageFlip.userMove(albumPoint(event), true);
    }
  });
  const finishAlbumPointer = (event) => {
    if (!albumPointer || albumPointer.id !== event.pointerId) return;
    const pointer = albumPointer;
    const moved = pointer.moved;
    albumPointer = null;
    // Taps and drags both stay in the same book viewer.
    const deltaX = event.clientX - pointer.x;
    const deltaY = event.clientY - pointer.y;
    const swipeThreshold = Math.min(80, moreBook.clientWidth * 0.18);
    if (event.type === 'pointerup' && moved && Math.abs(deltaX) >= swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY)) {
      // A normal phone swipe should finish the turn without requiring the
      // finger to travel beyond the book's outside edge.
      pageFlip.userStop(albumPoint(event), true);
      if (deltaX < 0) pageFlip.flipNext('top');
      else pageFlip.flipPrev('top');
    } else {
      pageFlip.userStop(albumPoint(event), !moved);
    }
    if (moved) suppressPhotoClickUntil = performance.now() + 500;
    if (moreBook.hasPointerCapture(event.pointerId)) moreBook.releasePointerCapture(event.pointerId);
  };
  moreBook.addEventListener('pointerup', finishAlbumPointer);
  moreBook.addEventListener('pointercancel', finishAlbumPointer);
  moreBook.addEventListener('lostpointercapture', finishAlbumPointer);
  moreBook.addEventListener('click', (event) => {
    const photoButton = event.target.closest('[data-more-photo]') ||
      (event.target === moreBook ? morePages.querySelector(`[data-more-photo="${moreIndex}"]`) : null);
    if (!photoButton || pageFlipBusy || performance.now() < suppressPhotoClickUntil) return;
    const photoIndex = Number(photoButton.dataset.morePhoto);
    if (photoIndex !== moreIndex) return;
    const bounds = moreBook.getBoundingClientRect();
    const direction = event.detail && event.clientX < bounds.left + bounds.width / 2 ? -1 : 1;
    void turnMorePhoto(direction);
  });
  moreDialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      void turnMorePhoto(-1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      void turnMorePhoto(1);
    }
  });
}
