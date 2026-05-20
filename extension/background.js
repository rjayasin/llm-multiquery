// Core fan-out logic, shared by the omnibox keyword and the popup shortcut.
//
// URL behavior mirrors multiquery.sh:
//   - Claude  and ChatGPT accept a ?q= param that prefills AND submits.
//   - Gemini has no such param, so we stash the query in storage and let
//     gemini-content.js type it into the page once the tab loads.

const STORAGE_KEY = "pendingGeminiQuery";

async function launch(query) {
  const q = (query || "").trim();
  if (!q) return;

  const encoded = encodeURIComponent(q);

  // Claude + ChatGPT: prefill and auto-submit via URL.
  await browser.tabs.create({ url: `https://claude.ai/new?q=${encoded}` });
  await browser.tabs.create({ url: `https://chatgpt.com/?q=${encoded}` });

  // Gemini: hand the raw query to the content script via storage, then open it.
  await browser.storage.local.set({ [STORAGE_KEY]: q });
  await browser.tabs.create({ url: "https://gemini.google.com/app" });
}

// Omnibox: typing `llm <query>` in the address bar and pressing Enter.
browser.omnibox.setDefaultSuggestion({
  description: "Ask Claude, ChatGPT, and Gemini all at once"
});
browser.omnibox.onInputEntered.addListener((text) => {
  launch(text);
});

// Popup: receives the query typed into popup.html.
browser.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "launch") {
    launch(msg.query);
  }
});
