// Capture-aware privacy behavior only: browsers do not expose a reliable way
// for a page to detect OS screenshots, external recorders, or another camera.
// Visibility changes are useful signals for briefly protecting on-page content.
(() => {
  const protectedView = document.querySelector("#protected-view");
  if (!protectedView) return;

  let dismissTimer;
  let focusWasLost = false;

  function protect() {
    window.clearTimeout(dismissTimer);
    document.body.classList.add("capture-protected");
    protectedView.hidden = false;
    protectedView.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => protectedView.classList.add("is-visible"));

    // Pause without seeking. Returning to the page never unexpectedly resumes audio.
    document.querySelectorAll("audio, video").forEach((media) => {
      if (!media.paused) media.pause();
    });
  }

  function restore() {
    if (document.visibilityState !== "visible") return;
    protectedView.classList.remove("is-visible");
    document.body.classList.remove("capture-protected");
    dismissTimer = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        protectedView.hidden = true;
        protectedView.setAttribute("aria-hidden", "true");
      }
    }, 360);
  }

  if ("visibilityState" in document) {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") protect();
      else restore();
    });
  }

  // Focus loss is common during normal use, so it is never treated as capture.
  // Only pair it with the independent hidden-page signal above.
  window.addEventListener("blur", () => { focusWasLost = true; });
  window.addEventListener("focus", () => {
    if (focusWasLost && document.visibilityState === "visible") restore();
    focusWasLost = false;
  });
})();
