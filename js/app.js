const countdownUnits = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Minutes" },
  { key: "seconds", label: "Seconds" },
];

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function initializeContent() {
  const { couple, wedding, venue, images } = WEDDING_CONFIG;

  document.title = `${couple.partnerOne} & ${couple.partnerTwo} | Wedding Invitation`;
  setText("[data-couple-names]", `${couple.partnerOne} & ${couple.partnerTwo}`);
  setText("[data-monogram]", couple.monogram);
  setText("[data-display-date]", wedding.displayDate);
  setText("[data-day]", wedding.day);
  setText("[data-ceremony-time]", wedding.ceremonyTime);
  setText("[data-reception-time]", wedding.receptionTime);
  setText("[data-ceremony-name]", venue.ceremony);
  setText("[data-ceremony-address]", venue.ceremonyAddress);
  setText("[data-reception-name]", venue.reception);
  setText("[data-reception-address]", venue.receptionAddress);
  setText("[data-year]", new Date(wedding.date).getFullYear());

  const heroImage = document.querySelector("[data-hero-image]");
  const portraitImage = document.querySelector("[data-portrait-image]");
  if (heroImage) heroImage.src = images.hero;
  if (portraitImage) portraitImage.src = images.portrait;

  const gallery = document.querySelector("[data-gallery]");
  if (gallery) {
    gallery.innerHTML = images.gallery
      .map(
        (image, index) => `
          <button class="gallery__item" type="button" data-gallery-index="${index}" aria-label="Open photo ${index + 1}">
            <img src="${image.source}" alt="${image.alt}" loading="lazy" />
          </button>`,
      )
      .join("");
  }
}

function initializeNavigation() {
  const menuButton = document.querySelector("[data-menu-button]");
  const menu = document.querySelector("[data-menu]");

  if (!menuButton || !menu) return;

  menuButton.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  menu.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      menu.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
}

function initializeCountdown() {
  const countdown = document.querySelector("[data-countdown]");
  const status = document.querySelector("[data-countdown-status]");
  if (!countdown || !status) return;

  const weddingTime = new Date(WEDDING_CONFIG.wedding.date).getTime();
  let timerId;

  const updateCountdown = () => {
    const remaining = weddingTime - Date.now();
    if (remaining <= 0) {
      countdown.hidden = true;
      status.textContent = "Today was the day. Thank you for celebrating with us.";
      window.clearInterval(timerId);
      return;
    }

    const values = {
      days: Math.floor(remaining / 86400000),
      hours: Math.floor((remaining / 3600000) % 24),
      minutes: Math.floor((remaining / 60000) % 60),
      seconds: Math.floor((remaining / 1000) % 60),
    };

    countdownUnits.forEach(({ key }) => {
      const value = countdown.querySelector(`[data-countdown-value="${key}"]`);
      if (value) value.textContent = String(values[key]).padStart(2, "0");
    });
  };

  updateCountdown();
  timerId = window.setInterval(updateCountdown, 1000);
}

function initializeGallery() {
  const gallery = document.querySelector("[data-gallery]");
  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImage = document.querySelector("[data-lightbox-image]");
  const closeButton = document.querySelector("[data-lightbox-close]");
  if (!gallery || !lightbox || !lightboxImage || !closeButton) return;

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.classList.remove("is-lightbox-open");
  };

  gallery.addEventListener("click", (event) => {
    const item = event.target.closest("[data-gallery-index]");
    if (!item) return;
    const image = WEDDING_CONFIG.images.gallery[Number(item.dataset.galleryIndex)];
    if (!image) return;
    lightboxImage.src = image.source;
    lightboxImage.alt = image.alt;
    lightbox.hidden = false;
    document.body.classList.add("is-lightbox-open");
    closeButton.focus();
  });

  closeButton.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
  });
}

function initializeRSVP() {
  const form = document.querySelector("[data-rsvp-form]");
  const status = document.querySelector("[data-rsvp-status]");
  if (!form || !status) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    status.textContent = "Your response is ready to connect to the RSVP service. No response has been sent yet.";
    status.className = "form-status form-status--notice";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeContent();
  initializeNavigation();
  initializeCountdown();
  initializeGallery();
  initializeRSVP();
});
