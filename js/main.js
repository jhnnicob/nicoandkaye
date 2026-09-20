import { weddingConfig } from './config.js';
import { initNavigation } from './navigation.js';
import { initGallery } from './gallery.js';
import { initAnimations } from './animations.js';

const applyConfigVariables = () => {
  const root = document.documentElement;
  root.style.setProperty('--bg-page', weddingConfig.colors.background);
  root.style.setProperty('--surface', weddingConfig.colors.surface);
  root.style.setProperty('--text', weddingConfig.colors.text);
  root.style.setProperty('--muted', weddingConfig.colors.muted);
  root.style.setProperty('--primary', weddingConfig.colors.primary);
  root.style.setProperty('--accent', weddingConfig.colors.accent);
};

const escapeHtml = (value = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const renderHero = () => {
  const section = document.createElement('section');
  section.className = 'hero section-hero';
  section.id = 'hero';
  section.setAttribute('data-reveal', 'hero');
  section.style.setProperty('--hero-image', `url("${weddingConfig.hero.image}")`);
  section.style.setProperty('--hero-position', weddingConfig.hero.backgroundPosition);
  section.style.setProperty('--hero-overlay', weddingConfig.hero.overlay);
  section.style.setProperty('--hero-bg', weddingConfig.hero.backgroundColor);

  section.innerHTML = `
    <div class="hero-media" aria-hidden="true"></div>
    <div class="page-shell hero-inner">
      <div class="hero-copy">
        <p class="eyebrow eyebrow-light">${escapeHtml(weddingConfig.hero.eyebrow)}</p>
        <h1 class="hero-title">${escapeHtml(weddingConfig.hero.title).replace('&amp;', '&')}</h1>
        <p class="hero-subtitle">${escapeHtml(weddingConfig.hero.subtitle).replace(/\n/g, '<br />')}</p>
        <p class="hero-secondary">${escapeHtml(weddingConfig.hero.secondary)}</p>
      </div>
      <div class="hero-meta">
        <p class="hero-meta__top">${escapeHtml(weddingConfig.hero.label)}</p>
        <div class="hero-meta__line">${escapeHtml(weddingConfig.hero.locationLine).replace(/\n/g, '<br />')}</div>
      </div>
    </div>
    <a class="scroll-cue" href="#story">SCROLL TO EXPLORE ↓</a>
  `;

  document.getElementById('hero-root').appendChild(section);
};

const renderStory = () => {
  const section = document.createElement('section');
  section.id = 'story';
  section.className = 'story section-shell';
  section.setAttribute('data-reveal', 'story');
  section.style.background = weddingConfig.story.backgroundColor;

  section.innerHTML = `
    <div class="page-shell story-layout">
      <div class="story-copy">
        <p class="eyebrow">${escapeHtml(weddingConfig.story.eyebrow)}</p>
        <h2 class="section-heading">${escapeHtml(weddingConfig.story.title)}</h2>
        <p class="story-text">${escapeHtml(weddingConfig.story.description)}</p>
        <div class="story-accent">${escapeHtml(weddingConfig.story.accentText).replace(/\n/g, '<br />')}</div>
        <a href="#details" class="inline-link">READ OUR STORY →</a>
      </div>
      <div class="story-visual">
        <div class="story-photo-frame">
          <img src="${weddingConfig.story.image}" alt="Nico and Kaye together" loading="lazy" />
        </div>
      </div>
    </div>
  `;

  document.getElementById('story-root').appendChild(section);
};

const renderDetails = () => {
  const section = document.createElement('section');
  section.id = 'details';
  section.className = 'details section-shell';
  section.setAttribute('data-reveal', 'details');
  section.style.setProperty('--details-image', `url("${weddingConfig.details.backgroundImage}")`);
  section.style.setProperty('--detail-overlay', String(weddingConfig.details.overlay));
  section.style.setProperty('--details-bg', weddingConfig.details.backgroundColor);

  const cardsHtml = weddingConfig.details.items
    .map(
      (item) => `
        <article class="detail-card">
          <p class="eyebrow detail-eyebrow">${escapeHtml(item.label)}</p>
          ${item.lines
            .map((line) => `<p class="detail-line">${escapeHtml(line)}</p>`)
            .join('')}
        </article>
      `,
    )
    .join('');

  section.innerHTML = `
    <div class="page-shell details-panel">
      <div class="details-header">
        <p class="eyebrow eyebrow-deep">${escapeHtml(weddingConfig.details.eyebrow)}</p>
        <h2 class="section-heading">${escapeHtml(weddingConfig.details.title)}</h2>
      </div>
      <div class="detail-grid">
        ${cardsHtml}
      </div>
      <a href="#gallery" class="inline-link inline-link--dark">VIEW MAP →</a>
    </div>
  `;

  document.getElementById('details-root').appendChild(section);
};

const renderGallery = () => {
  const section = document.createElement('section');
  section.id = 'gallery';
  section.className = 'gallery section-shell';
  section.setAttribute('data-reveal', 'gallery');
  section.style.background = weddingConfig.gallery.backgroundColor;

  const galleryMarkup = weddingConfig.gallery.images
    .map(
      (src, index) => `
        <button class="gallery-item" type="button" data-gallery-item="${src}" aria-label="View photo ${index + 1}">
          <img src="${src}" alt="Wedding moment ${index + 1}" loading="lazy" />
        </button>
      `,
    )
    .join('');

  section.innerHTML = `
    <div class="page-shell gallery-shell">
      <div class="gallery-header">
        <p class="eyebrow">${escapeHtml(weddingConfig.gallery.title)}</p>
        <h2 class="section-heading center">${escapeHtml(weddingConfig.gallery.subtitle)}</h2>
      </div>
      <div class="gallery-grid">${galleryMarkup}</div>
      <div class="gallery-actions">
        <a href="#rsvp" class="inline-link">${escapeHtml(weddingConfig.gallery.buttonText)}</a>
      </div>
    </div>
    <div class="gallery-modal" data-gallery-modal aria-hidden="true">
      <button class="gallery-modal__close" type="button" data-modal-close aria-label="Close photo">×</button>
      <img data-gallery-image src="" alt="Expanded wedding photo" />
    </div>
  `;

  document.getElementById('gallery-root').appendChild(section);
};

const renderRSVP = () => {
  const section = document.createElement('section');
  section.id = 'rsvp';
  section.className = 'rsvp section-shell';
  section.setAttribute('data-reveal', 'rsvp');
  section.style.background = weddingConfig.rsvp.backgroundColor;

  section.innerHTML = `
    <div class="page-shell rsvp-layout">
      <div class="rsvp-copy">
        <p class="eyebrow eyebrow-deep">${escapeHtml(weddingConfig.rsvp.eyebrow)}</p>
        <h2 class="section-heading">${escapeHtml(weddingConfig.rsvp.title).replace(/\n/g, '<br />')}</h2>
        <p class="rsvp-text">${escapeHtml(weddingConfig.rsvp.description)}</p>
        <p class="rsvp-deadline">${escapeHtml(weddingConfig.rsvp.details)}</p>
        <a class="cta-button" href="${weddingConfig.rsvp.url}">${escapeHtml(weddingConfig.rsvp.buttonText)}</a>
      </div>
      <div class="rsvp-card">
        <p class="rsvp-footer-text">${escapeHtml(weddingConfig.rsvp.footer)}</p>
      </div>
    </div>
  `;

  document.getElementById('rsvp-root').appendChild(section);
};

const renderClosing = () => {
  const section = document.createElement('section');
  section.id = 'closing';
  section.className = 'closing';
  section.setAttribute('data-reveal', 'closing');
  section.style.setProperty('--closing-image', `url("${weddingConfig.closing.image}")`);
  section.style.setProperty('--closing-overlay', String(weddingConfig.closing.overlay));
  section.style.setProperty('--closing-bg', weddingConfig.closing.backgroundColor);

  section.innerHTML = `
    <div class="closing-overlay"></div>
    <div class="page-shell closing-content">
      <p class="eyebrow eyebrow-light">${escapeHtml(weddingConfig.closing.eyebrow)}</p>
      <h2>${escapeHtml(weddingConfig.closing.title)}</h2>
      <p class="closing-message">${escapeHtml(weddingConfig.closing.message).replace(/\n/g, '<br />')}</p>
      <div class="closing-heart">♡</div>
      <div class="closing-monogram">${escapeHtml(weddingConfig.closing.footerMonogram)}</div>
      <p class="closing-names">${escapeHtml(weddingConfig.closing.names)}</p>
      <p class="closing-meta">${escapeHtml(weddingConfig.closing.date)}</p>
      <p class="closing-meta">${escapeHtml(weddingConfig.closing.venue)}</p>
      <p class="closing-meta">${escapeHtml(weddingConfig.closing.location)}</p>
    </div>
  `;

  document.getElementById('closing-root').appendChild(section);
};

const renderPage = () => {
  applyConfigVariables();
  renderHero();
  renderStory();
  renderDetails();
  renderGallery();
  renderRSVP();
  renderClosing();
};

document.addEventListener('DOMContentLoaded', () => {
  renderPage();
  initNavigation();
  initGallery();
  initAnimations();
});
