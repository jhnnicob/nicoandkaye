(() => {
  const audio = document.getElementById('wedding-music');
  if (!audio || audio.dataset.initialized) return;
  audio.dataset.initialized = 'true';
  const preferenceKey = 'nico-kaye-music';
  const readPreference = () => {
    try { return window.localStorage.getItem(preferenceKey); } catch { return null; }
  };
  const savePreference = (value) => {
    try { window.localStorage.setItem(preferenceKey, value); } catch { /* Private browsing can disable storage. */ }
  };
  let manuallyPaused = readPreference() === 'paused';
  let pending = null;
  let blocked = false;
  let failed = false;
  let disposed = false;
  let automaticallyPaused = false;
  let pageSuspended = false;
  let windowFocused = document.hasFocus();
  const isActive = () => !pageSuspended && document.visibilityState === 'visible' &&
    windowFocused && document.hasFocus();
  let layoutFrame = 0;
  const cleanups = [];
  audio.loop = true;
  audio.preload = 'metadata';
  try { audio.volume = 0.25; } catch { /* Some mobile devices control volume through the OS. */ }

  const player = document.createElement('div');
  player.className = 'music-player';
  player.innerHTML = `
    <button class="music-player__button" type="button" aria-label="Play background music" aria-pressed="false">
      <svg data-music-note viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 18V5l11-2v13M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/></svg>
      <svg data-music-pause viewBox="0 0 24 24" aria-hidden="true" focusable="false" hidden><path d="M8 5v14M16 5v14"/></svg>
      <span class="music-player__hint" hidden>Tap to Play Music</span>
    </button>
    <span class="music-player__status" role="status" aria-live="polite"></span>`;
  document.body.appendChild(player);
  const button = player.querySelector('button');
  const note = player.querySelector('[data-music-note]');
  const pause = player.querySelector('[data-music-pause]');
  const hint = player.querySelector('.music-player__hint');
  const status = player.querySelector('.music-player__status');
  const dialogs = [...document.querySelectorAll('dialog')];
  const protectedControls = [...document.querySelectorAll(
    '[data-rsvp-form] [type="submit"], .invitation-actions, .main-nav, [data-gallery-more], .invitation-footer a'
  )];

  const listen = (target, event, handler, options) => {
    target.addEventListener(event, handler, options);
    cleanups.push(() => target.removeEventListener(event, handler, options));
  };
  const placeControl = () => {
    layoutFrame = 0;
    if (disposed) return;
    player.hidden = dialogs.some((dialog) => dialog.open);
    player.style.setProperty('--music-lift', '0px');
    if (player.hidden) return;
    let lift = 0;
    for (const control of protectedControls) {
      const target = control.getBoundingClientRect();
      if (!target.width || !target.height || target.bottom <= 0 || target.top >= window.innerHeight) continue;
      const bounds = player.getBoundingClientRect();
      if (bounds.left < target.right + 8 && bounds.right > target.left - 8 &&
          bounds.top < target.bottom + 8 && bounds.bottom > target.top - 8) {
        lift += bounds.bottom - target.top + 12;
        player.style.setProperty('--music-lift', `${lift}px`);
      }
    }
  };
  const scheduleLayout = () => {
    if (!disposed && !layoutFrame) layoutFrame = window.requestAnimationFrame(placeControl);
  };
  const render = () => {
    if (disposed) return;
    const playing = !audio.paused && !failed;
    note.hidden = playing;
    pause.hidden = !playing;
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? 'Pause background music' : failed ? 'Retry background music' : 'Play background music');
    button.setAttribute('aria-busy', String(Boolean(pending)));
    hint.hidden = playing || manuallyPaused || (!blocked && !failed);
    hint.textContent = failed ? 'Music unavailable — tap to retry' : 'Tap to Play Music';
    status.textContent = failed ? 'Music could not load. You can tap the music button to retry.'
      : playing ? 'Background music playing.' : manuallyPaused ? 'Background music paused.'
      : blocked ? 'Tap to play background music.' : '';
    scheduleLayout();
  };

  const tryPlay = () => {
    if (disposed || manuallyPaused || pending || !isActive() || !audio.paused) return pending;
    blocked = false;
    failed = false;
    let attempt;
    try {
      // Keep play() synchronous with a real click when autoplay is blocked.
      attempt = audio.play();
    } catch (error) {
      attempt = Promise.reject(error);
    }
    const request = Promise.resolve(attempt).then(() => {
      if (disposed || manuallyPaused || !isActive()) {
        if (!disposed && !manuallyPaused) automaticallyPaused = true;
        audio.pause();
      }
    }).catch((error) => {
      if (disposed || manuallyPaused || error?.name === 'AbortError') return;
      blocked = error?.name === 'NotAllowedError';
      failed = !blocked;
      automaticallyPaused = false;
    }).finally(() => {
      if (pending === request) pending = null;
      render();
      synchronizePlayback();
    });
    pending = request;
    render();
    return request;
  };

  function synchronizePlayback() {
    if (disposed) return;
    if (manuallyPaused) {
      automaticallyPaused = false;
      if (!audio.paused) audio.pause();
    } else if (!isActive()) {
      // Preserve eligibility across blur -> hidden -> pagehide. A second event
      // must not forget that the first event already paused a playing track.
      if (!audio.paused) {
        if (!manuallyPaused && !blocked && !failed) automaticallyPaused = true;
        audio.pause();
      }
    } else if (automaticallyPaused && !blocked && !failed && !pending) {
      automaticallyPaused = false;
      void tryPlay();
    }
    render();
  }

  listen(button, 'click', () => {
    if (!failed && (pending || !audio.paused)) {
      manuallyPaused = true;
      automaticallyPaused = false;
      savePreference('paused');
      audio.pause();
      render();
      return;
    }
    manuallyPaused = false;
    automaticallyPaused = false;
    savePreference('playing');
    if (failed || audio.error) audio.load();
    void tryPlay();
  });
  const opener = document.getElementById('invitation-open');
  if (opener) listen(opener, 'click', () => {
    if (!manuallyPaused && !failed) void tryPlay();
  });
  listen(audio, 'playing', () => { synchronizePlayback(); });
  listen(audio, 'pause', render);
  listen(audio, 'error', () => { failed = true; automaticallyPaused = false; render(); });
  listen(document, 'visibilitychange', () => {
    if (document.visibilityState === 'visible') windowFocused = document.hasFocus();
    synchronizePlayback();
  });
  listen(window, 'blur', () => { windowFocused = false; synchronizePlayback(); });
  listen(window, 'focus', () => { windowFocused = true; synchronizePlayback(); });
  listen(window, 'scroll', scheduleLayout, { passive: true });
  listen(window, 'resize', scheduleLayout, { passive: true });
  if (window.visualViewport) {
    listen(window.visualViewport, 'resize', scheduleLayout, { passive: true });
    listen(window.visualViewport, 'scroll', scheduleLayout, { passive: true });
  }
  const dialogObserver = new MutationObserver(scheduleLayout);
  dialogs.forEach((dialog) => dialogObserver.observe(dialog, { attributes: true, attributeFilter: ['open'] }));

  listen(window, 'pagehide', (event) => {
    pageSuspended = true;
    synchronizePlayback();
    if (!event.persisted) {
      disposed = true;
      dialogObserver.disconnect();
      if (layoutFrame) window.cancelAnimationFrame(layoutFrame);
      cleanups.forEach((cleanup) => cleanup());
    }
  });
  listen(window, 'pageshow', (event) => {
    if (!event.persisted) return;
    pageSuspended = false;
    windowFocused = document.hasFocus();
    const preference = readPreference();
    if (preference === 'paused' || preference === 'playing') manuallyPaused = preference === 'paused';
    synchronizePlayback();
  });
  render();
  if (!manuallyPaused) void tryPlay();
})();
