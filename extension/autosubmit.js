// Runs on claude.ai and chatgpt.com. These pages populate their composer from
// the ?q= URL param (the site's own code, which registers the text properly).
// They reject programmatic "typing," so we don't type — we just do the one
// thing the user would do by hand: once the composer actually has the text,
// press Enter. Dispatching the key event on the editor node doesn't require the
// tab to be focused, so this works even while the tab is in the background.
//
// Keyed per site (submitClaude / submitChatgpt) so a normal visit never submits.

const POLL_INTERVAL_MS = 250;
const TIMEOUT_MS = 20000;

const host = location.hostname;
let site = null;
if (host.includes("claude")) site = "claude";
else if (host.includes("chatgpt") || host.includes("openai")) site = "chatgpt";

const CONFIG = {
  claude: {
    flagKey: "submitClaude",
    editorSelectors: [
      "div.ProseMirror[contenteditable='true']",
      "[contenteditable='true']"
    ],
    sendSelectors: [
      "button[aria-label='Send message']",
      "button[aria-label*='Send' i]"
    ]
  },
  chatgpt: {
    flagKey: "submitChatgpt",
    editorSelectors: [
      "#prompt-textarea",
      "div.ProseMirror[contenteditable='true']",
      "textarea"
    ],
    sendSelectors: [
      "button[data-testid='send-button']",
      "button[aria-label*='Send' i]"
    ]
  }
};

function findFirst(selectors) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function isEnabled(btn) {
  return btn && !btn.disabled && btn.getAttribute("aria-disabled") !== "true";
}

function editorText(el) {
  return (el.isContentEditable ? el.textContent : el.value || "").trim();
}

// A plain element.click() only fires a `click` event, which these send buttons
// ignore — they're wired to the pointer/mouse sequence a real click produces.
// So we dispatch the full sequence (pointerdown → mousedown → pointerup →
// mouseup → click) at the button's center, like an actual mouse press.
function realClick(btn) {
  const r = btn.getBoundingClientRect();
  const base = {
    bubbles: true, cancelable: true, view: window,
    clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0
  };
  btn.dispatchEvent(new PointerEvent("pointerdown", { ...base, pointerId: 1, isPrimary: true }));
  btn.dispatchEvent(new MouseEvent("mousedown", base));
  btn.dispatchEvent(new PointerEvent("pointerup", { ...base, pointerId: 1, isPrimary: true }));
  btn.dispatchEvent(new MouseEvent("mouseup", base));
  btn.dispatchEvent(new MouseEvent("click", base));
}

async function run() {
  if (!site) return;
  const cfg = CONFIG[site];

  const stored = await browser.storage.local.get(cfg.flagKey);
  if (!stored[cfg.flagKey]) return;

  // Clear immediately so refreshes / later visits don't re-submit.
  await browser.storage.local.remove(cfg.flagKey);

  // Wait until ?q= has populated the composer AND the Send button is enabled,
  // then fire a real mouse click on it.
  const deadline = Date.now() + TIMEOUT_MS;
  const tick = () => {
    const editor = findFirst(cfg.editorSelectors);
    const btn = findFirst(cfg.sendSelectors);
    if (editor && editorText(editor).length > 0 && isEnabled(btn)) {
      realClick(btn);
      return;
    }
    if (Date.now() < deadline) setTimeout(tick, POLL_INTERVAL_MS);
  };
  tick();
}

run();
