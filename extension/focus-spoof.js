// Runs in the PAGE's main world (not the content-script sandbox) at
// document_start, so it can override the focus/visibility APIs the page's own
// scripts read. Background tabs normally report themselves as hidden/unfocused,
// and these sites refuse to submit when they think they're not visible. We make
// the page always believe it is focused and visible.
//
// Caveats: this can't undo the browser's own throttling of timers/rAF in
// background tabs; it only addresses page-level focus/visibility checks. Requires
// content-script `world: "MAIN"` support (Firefox 128+).

(() => {
  const def = (obj, prop, value) => {
    try {
      Object.defineProperty(obj, prop, { configurable: true, get: () => value });
    } catch (e) {}
  };

  // Visibility API — always "visible".
  def(document, "hidden", false);
  def(document, "visibilityState", "visible");
  def(document, "webkitHidden", false);
  def(document, "webkitVisibilityState", "visible");

  // Focus checks — always focused.
  try { document.hasFocus = () => true; } catch (e) {}
  def(document, "activeElement", document.activeElement || document.body);

  // Swallow the events that would tell the page it lost focus/visibility, so it
  // never flips into a paused/hidden state.
  const swallow = (e) => {
    if (!e.isTrusted) return; // let our own synthetic focus events through
    e.stopImmediatePropagation();
  };
  window.addEventListener("blur", swallow, true);
  document.addEventListener("visibilitychange", swallow, true);
  window.addEventListener("pagehide", swallow, true);

  // Nudge the page into its "visible/focused" code path now.
  try {
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));
  } catch (e) {}
})();
