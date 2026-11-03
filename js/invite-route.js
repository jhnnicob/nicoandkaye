// One invitation template serves both new and previously sent URLs.
(() => {
  const destination = new URL('../invite.html', window.location.href);
  destination.search = window.location.search;
  destination.hash = window.location.hash;
  document.getElementById('invitation-route').href = destination.href;
  window.location.replace(destination.href);
})();
