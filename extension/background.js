// Core fan-out logic, shared by the omnibox keyword and the popup shortcut.
//
// Populate vs. submit:
//   - Claude and ChatGPT populate reliably from the ?q= URL param — the site's
//     own code injects the text and registers it with its editor framework.
//     Trying to "type" into these ProseMirror editors ourselves doesn't take
//     (they ignore programmatic input), so we let ?q= do it and only press Enter.
//   - Gemini has no such param, so gemini-content.js types the query in.
// The per-site submit flags tell each content script "we launched this — go
// ahead and submit," so a normal visit to the site never auto-submits.

const STORAGE_KEY = "pendingGeminiQuery";

async function launch(query) {
  const q = (query || "").trim();
  if (!q) return;

  const encoded = encodeURIComponent(q);

  await browser.storage.local.set({
    submitClaude: true,
    submitChatgpt: true,
    [STORAGE_KEY]: q
  });

  // focus-spoof.js makes each backgrounded tab believe it is focused/visible, so
  // all three can submit even though only one tab can actually be active. Order
  // no longer matters.
  browser.tabs.create({ url: `https://claude.ai/new?q=${encoded}` });
  browser.tabs.create({ url: `https://chatgpt.com/?q=${encoded}` });
  browser.tabs.create({ url: "https://gemini.google.com/app" });
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
  if (msg && msg.type === "launch") launch(msg.query);
});
