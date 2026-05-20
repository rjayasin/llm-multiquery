// Runs on gemini.google.com. Gemini's web app has no prefill URL param, so the
// background script stashes the query in storage and we type it into the page
// here once the composer is ready.
//
// This is the brittle part of the extension: it depends on Gemini's DOM, which
// Google changes without notice. If we can't find the input within the timeout,
// we fall back to copying the query to the clipboard so the user can paste it.

const STORAGE_KEY = "pendingGeminiQuery";
const POLL_INTERVAL_MS = 250;
const TIMEOUT_MS = 10000;

// Selectors for the composer, most-specific first.
const INPUT_SELECTORS = [
  "rich-textarea div[contenteditable='true']",
  "div[contenteditable='true'][role='textbox']",
  "div[contenteditable='true']",
  "textarea"
];

// Selectors for the send button, most-specific first.
const SEND_SELECTORS = [
  "button[aria-label*='Send' i]",
  "button.send-button",
  "button[mattooltip*='Send' i]"
];

function findFirst(selectors) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function setText(input, text) {
  if (input.tagName === "TEXTAREA") {
    input.value = text;
  } else {
    input.focus();
    input.textContent = text;
  }
  // Let Angular/React notice the change.
  input.dispatchEvent(new InputEvent("input", { bubbles: true, data: text }));
}

function submit(input) {
  const sendBtn = findFirst(SEND_SELECTORS);
  if (sendBtn && !sendBtn.disabled) {
    sendBtn.click();
    return;
  }
  // Fall back to pressing Enter in the composer.
  const opts = { bubbles: true, key: "Enter", code: "Enter", keyCode: 13, which: 13 };
  input.dispatchEvent(new KeyboardEvent("keydown", opts));
  input.dispatchEvent(new KeyboardEvent("keyup", opts));
}

async function run() {
  const stored = await browser.storage.local.get(STORAGE_KEY);
  const query = stored[STORAGE_KEY];
  if (!query) return;

  // Clear immediately so refreshes / other Gemini tabs don't re-fire.
  await browser.storage.local.remove(STORAGE_KEY);

  const deadline = Date.now() + TIMEOUT_MS;

  const tick = () => {
    const input = findFirst(INPUT_SELECTORS);
    if (input) {
      setText(input, query);
      // Give the send button a moment to enable after the input event.
      setTimeout(() => submit(input), 150);
      return;
    }
    if (Date.now() < deadline) {
      setTimeout(tick, POLL_INTERVAL_MS);
    } else {
      // DOM changed or not logged in — leave the query on the clipboard.
      navigator.clipboard.writeText(query).catch(() => {});
    }
  };

  tick();
}

run();
