const thumbnailFilenames = [
  'thumbnail1.jpg',
  'thumbnail2.jpg',
  'thumbnail3.jpg',
  'thumbnail4.jpg',
  'thumbnail5.jpg',
  'thumbnail6.jpg',
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
  'MM-225.jpg',
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
  .map((filename) => {
    const match = filename.match(/^thumbnail(\d+)\.(jpe?g|png|webp)$/i);
    return match
      ? { filename, sequence: Number(match[1]), source: `assets/gallery/${filename}` }
      : null;
  })
  .filter((image) => image !== null)
  .sort((first, second) => {
    const displayOrder = { 1: 2, 2: 3, 3: 1, 4: 4, 5: 6, 6: 5 };
    const firstOrder = displayOrder[first.sequence] || first.sequence;
    const secondOrder = displayOrder[second.sequence] || second.sequence;
    return firstOrder - secondOrder;
  });

const additionalImages = additionalFilenames
  .slice()
  .sort((first, second) => first.localeCompare(second, 'en', { numeric: true, sensitivity: 'base' }))
  .map((filename) => ({ filename, source: `assets/gallery/${filename}` }));
const galleryImages = [...thumbnailImages, ...additionalImages];
const galleryGrid = document.querySelector('[data-gallery-grid]');
const moreGalleryGrid = document.querySelector('[data-gallery-more-grid]');
const moreDialog = document.querySelector('[data-gallery-more-dialog]');
const moreDialogClose = document.querySelector('[data-gallery-more-close]');
const morePages = document.querySelector('[data-more-pages]');
const moreCount = document.querySelector('[data-more-count]');
const moreBook = document.querySelector('[data-more-book]');
const morePreviousButton = document.querySelector('[data-more-previous]');
const moreNextButton = document.querySelector('[data-more-next]');
const lightbox = document.querySelector('[data-gallery-lightbox]');
const lightboxImage = document.querySelector('[data-gallery-image]');
const lightboxCount = document.querySelector('[data-gallery-count]');
const closeButton = document.querySelector('[data-gallery-close]');
const previousButton = document.querySelector('[data-gallery-previous]');
const nextButton = document.querySelector('[data-gallery-next]');
const moreButton = document.querySelector('[data-gallery-more]');

if (
  galleryGrid &&
  moreGalleryGrid &&
  moreDialog instanceof HTMLDialogElement &&
  moreDialogClose &&
  morePages &&
  moreCount &&
  moreBook &&
  morePreviousButton &&
  moreNextButton &&
  lightbox instanceof HTMLDialogElement &&
  lightboxImage instanceof HTMLImageElement &&
  lightboxCount &&
  closeButton &&
  previousButton &&
  nextButton &&
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
    .map((image, index) => createPhotoMarkup(image, index, index === 0, index === 5))
    .join('');

  let activeIndex = 0;
  let moreIndex = 0;
  let returnToMoreDialog = false;
  let pageFlipBusy = false;
  let zoomScale = 1;
  let panX = 0;
  let panY = 0;
  let dragStart = null;
  let pinchStart = null;
  let previousTap = null;
  const pointers = new Map();
  const imageCache = new Map();
  let pageFlip = null;
  let albumPointer = null;
  let suppressPhotoClickUntil = 0;
  let readyPhotoIndex = -1;
  let pendingWrapPage = null;

  const pageItems = [
    { image: additionalImages[additionalImages.length - 1], index: additionalImages.length - 1, edge: 'previous' },
    ...additionalImages.map((image, index) => ({ image, index, edge: '' })),
    { image: additionalImages[0], index: 0, edge: 'next' },
  ];
  morePages.innerHTML = pageItems.map(({ image, index, edge }) => `
    <div class="gallery-more-slideshow__page" data-density="soft" data-more-photo-page="${index}"${edge ? ` data-wrap-page="${edge}" aria-hidden="true"` : ''}>
      <button class="gallery-more-slideshow__photo-button" type="button" data-more-photo="${index}" aria-label="View photo ${index + 1} full size"${edge ? ' tabindex="-1"' : ''}>
        <img src="${image.source}" alt="Nico and Kaye, additional photo ${index + 1}" loading="lazy" decoding="async" draggable="false" />
      </button>
    </div>`).join('');

  const preloadPhoto = (index) => {
    const normalizedIndex = (index + additionalImages.length) % additionalImages.length;
    const image = additionalImages[normalizedIndex];
    if (!imageCache.has(image.source)) {
      const preload = new Image();
      const loaded = new Promise((resolve, reject) => {
        preload.addEventListener('load', resolve, { once: true });
        preload.addEventListener('error', () => reject(new Error(`Unable to load gallery photo: ${image.source}`)), { once: true });
      });
      preload.src = image.source;
      imageCache.set(image.source, loaded.then(() => preload.decode()).then(() => preload));
    }
    return imageCache.get(image.source);
  };

  const preloadNeighbors = async (index) => {
    readyPhotoIndex = -1;
    const neighbors = [index - 1, index, index + 1];
    try {
      await Promise.all(neighbors.map(async (photoIndex) => {
        const normalizedIndex = (photoIndex + additionalImages.length) % additionalImages.length;
        await preloadPhoto(normalizedIndex);
        // Decode the actual page images as well as the network preloads.
        await Promise.all(Array.from(morePages.querySelectorAll(
          `[data-more-photo-page="${normalizedIndex}"] img`
        ), async (image) => {
          image.loading = 'eager';
          await image.decode();
        }));
      }));
      if (moreIndex === index) readyPhotoIndex = index;
      // Warm the next pair without delaying this turn or fetching the whole album.
      [index - 2, index + 2].forEach((next) => void preloadPhoto(next).catch(() => {}));
    } catch (error) {
      console.error(error);
    }
  };

  const showMorePhoto = (index) => {
    moreIndex = (index + additionalImages.length) % additionalImages.length;
    moreCount.textContent = `${moreIndex + 1} / ${additionalImages.length}`;
    moreBook.setAttribute('aria-label', `Photo album, photo ${moreIndex + 1} of ${additionalImages.length}`);
    preloadNeighbors(moreIndex);
  };

  const updateMorePhotoIndex = (pageIndex) => {
    if (pageIndex === 0) {
      showMorePhoto(additionalImages.length - 1);
      pendingWrapPage = additionalImages.length;
      return;
    }
    if (pageIndex === additionalImages.length + 1) {
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
    pageFlip = new window.St.PageFlip(morePages, {
      width: 360,
      height: 480,
      size: 'stretch',
      minWidth: 200,
      maxWidth: 390,
      minHeight: 133,
      maxHeight: 520,
      flippingTime: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 780,
      drawShadow: true,
      maxShadowOpacity: 0.32,
      usePortrait: true,
      startPage: 1,
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
  };

  const turnMorePhoto = async (direction) => {
    if (!pageFlip || pageFlipBusy || additionalImages.length < 2) return;
    const targetIndex = (moreIndex + direction + additionalImages.length) % additionalImages.length;
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

  const showPhoto = (index) => {
    activeIndex = (index + galleryImages.length) % galleryImages.length;
    const image = galleryImages[activeIndex];
    lightboxImage.src = image.source;
    lightboxImage.alt = `Nico and Kaye, photo ${activeIndex + 1}`;
    lightboxCount.textContent = `${activeIndex + 1} / ${galleryImages.length}`;
    resetZoom();
  };

  const clampPan = () => {
    const stage = lightboxImage.parentElement;
    if (!stage) return;
    const maxX = Math.max(0, (lightboxImage.offsetWidth * zoomScale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (lightboxImage.offsetHeight * zoomScale - stage.clientHeight) / 2);
    panX = Math.min(maxX, Math.max(-maxX, panX));
    panY = Math.min(maxY, Math.max(-maxY, panY));
  };

  const renderZoom = () => {
    clampPan();
    lightboxImage.style.setProperty('--zoom-scale', String(zoomScale));
    lightboxImage.style.setProperty('--zoom-x', `${panX}px`);
    lightboxImage.style.setProperty('--zoom-y', `${panY}px`);
    lightboxImage.classList.toggle('is-zoomed', zoomScale > 1);
    lightboxImage.setAttribute('aria-label', zoomScale > 1
      ? 'Photo zoomed. Drag to pan, double-tap or scroll to zoom out.'
      : 'Photo at full view. Double-tap or scroll to zoom in.');
  };

  function resetZoom() {
    zoomScale = 1;
    panX = 0;
    panY = 0;
    pointers.clear();
    dragStart = null;
    pinchStart = null;
    previousTap = null;
    lightboxImage.style.removeProperty('--zoom-scale');
    lightboxImage.style.removeProperty('--zoom-x');
    lightboxImage.style.removeProperty('--zoom-y');
    lightboxImage.classList.remove('is-zoomed');
  }

  const setZoom = (scale, pointX, pointY) => {
    const previousScale = zoomScale;
    zoomScale = Math.min(4, Math.max(1, scale));
    if (zoomScale === 1) {
      panX = 0;
      panY = 0;
    } else if (pointX !== undefined && pointY !== undefined) {
      const rect = lightboxImage.getBoundingClientRect();
      const relativeX = pointX - (rect.left + rect.width / 2);
      const relativeY = pointY - (rect.top + rect.height / 2);
      const factor = 1 - zoomScale / previousScale;
      panX += relativeX * factor;
      panY += relativeY * factor;
    }
    renderZoom();
  };

  const openLightbox = (index) => {
    showPhoto(index);
    if (!lightbox.open) lightbox.showModal();
    document.body.classList.add('gallery-lightbox-open');
    closeButton.focus();
  };

  const closeLightbox = () => {
    if (lightbox.open) lightbox.close();
    document.body.classList.remove('gallery-lightbox-open');
  };

  galleryGrid.addEventListener('click', (event) => {
    const photo = event.target.closest('[data-gallery-index]');
    if (photo) openLightbox(Number(photo.dataset.galleryIndex));
  });

  moreButton.addEventListener('click', () => {
    showMorePhoto(0);
    moreDialog.showModal();
    if (pageFlip) pageFlip.turnToPage(1);
    else window.requestAnimationFrame(initializePageFlip);
  });
  moreDialogClose.addEventListener('click', () => moreDialog.close());
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
    const moved = albumPointer.moved;
    albumPointer = null;
    // A tap remains a photo-preview click. A drag must never open the lightbox.
    pageFlip.userStop(albumPoint(event), !moved);
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
    returnToMoreDialog = true;
    moreDialog.close();
    openLightbox(thumbnailImages.length + photoIndex);
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
  closeButton.addEventListener('click', closeLightbox);
  previousButton.addEventListener('click', () => showPhoto(activeIndex - 1));
  nextButton.addEventListener('click', () => showPhoto(activeIndex + 1));

  lightboxImage.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (event.isTrusted) lightboxImage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 2) {
      const [first, second] = [...pointers.values()];
      pinchStart = {
        distance: Math.hypot(second.x - first.x, second.y - first.y),
        scale: zoomScale,
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
        panX,
        panY,
      };
      dragStart = null;
      return;
    }

    const now = Date.now();
    if (
      previousTap &&
      now - previousTap.time < 320 &&
      Math.hypot(event.clientX - previousTap.x, event.clientY - previousTap.y) < 28
    ) {
      previousTap = null;
      setZoom(zoomScale > 1 ? 1 : 2.5, event.clientX, event.clientY);
      return;
    }

    previousTap = { time: now, x: event.clientX, y: event.clientY };
    if (zoomScale > 1) {
      dragStart = { x: event.clientX, y: event.clientY, panX, panY };
    }
  });

  lightboxImage.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pinchStart && pointers.size === 2) {
      const [first, second] = [...pointers.values()];
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      const midpointX = (first.x + second.x) / 2;
      const midpointY = (first.y + second.y) / 2;
      zoomScale = Math.min(4, Math.max(1, pinchStart.scale * distance / pinchStart.distance));
      panX = pinchStart.panX + midpointX - pinchStart.x;
      panY = pinchStart.panY + midpointY - pinchStart.y;
      renderZoom();
    } else if (dragStart && zoomScale > 1) {
      panX = dragStart.panX + event.clientX - dragStart.x;
      panY = dragStart.panY + event.clientY - dragStart.y;
      renderZoom();
    }
  });

  const finishPointer = (event) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchStart = null;
    if (pointers.size === 0) dragStart = null;
  };

  lightboxImage.addEventListener('pointerup', finishPointer);
  lightboxImage.addEventListener('pointercancel', finishPointer);
  lightboxImage.addEventListener('wheel', (event) => {
    event.preventDefault();
    setZoom(zoomScale + (event.deltaY < 0 ? 0.25 : -0.25), event.clientX, event.clientY);
  }, { passive: false });

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox.addEventListener('close', () => {
    document.body.classList.remove('gallery-lightbox-open');
    resetZoom();
    if (returnToMoreDialog) {
      returnToMoreDialog = false;
      moreDialog.showModal();
      moreBook.focus();
    }
  });
  lightbox.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeLightbox();
      return;
    }
    if (event.key === 'ArrowLeft') showPhoto(activeIndex - 1);
    if (event.key === 'ArrowRight') showPhoto(activeIndex + 1);
  });
}
