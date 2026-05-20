# llm-multiquery

A small macOS script — and a Firefox extension — that fan a single prompt out to
**Claude.ai**, **ChatGPT**, and **Gemini** at once, each opening in its own new
browser tab.

## Usage (script)

```bash
./multiquery.sh "your question here"
./multiquery.sh your question here     # bare words also work
```

## What it does

- **Claude.ai** — opens `claude.ai/new?q=...`, which prefills *and* submits the prompt.
- **ChatGPT** — opens `chatgpt.com/?q=...`, which prefills *and* submits the prompt.
- **Gemini** — opens a fresh chat at `gemini.google.com/app` and copies the prompt
  to your clipboard (Gemini's web app has no prefill URL param), so just paste with
  `Cmd+V` and hit Enter.

Tabs open in your default browser via the macOS `open` command. The prompt is
URL-encoded with `python3`, which ships with macOS.

## Requirements

- macOS (uses `open` and `pbcopy`)
- `python3` (preinstalled on macOS)
- You must be logged in to each service for the prompt to submit.

## Firefox extension

The `extension/` directory is a WebExtension that does the same thing from inside
Firefox, with two trigger paths:

- **Address-bar keyword** — type `llm your question here` in the URL bar and press
  Enter.
- **Keyboard shortcut** — press `Cmd+Option+L` (`Ctrl+Alt+L` on non-mac) to open a
  small popup, type your prompt, and press Enter.

> A Firefox shortcut can't read text already typed into the address bar — extensions
> aren't given the address bar's live contents — which is why the shortcut opens a
> popup rather than reading the URL bar directly.

Either path opens Claude, ChatGPT, and Gemini in three new tabs, with your prompt
prefilled in each:

- **Claude** and **ChatGPT** are prefilled via their `?q=` URL param.
- **Gemini** has no such param, so a content script types the prompt into the Gemini
  composer (with a clipboard fallback if its DOM changes and the composer can't be
  found — just paste with `Cmd+V`).

### Auto-submit: work in progress

Auto-submitting the prompt is still in development. Right now the prompt is
**submitted automatically only in the tab that is currently focused** — the last one
opened (Gemini, by default). The other two tabs are prefilled but not yet submitted;
switch to each and press **Enter** to send.

The blocker is that submitting requires firing the send button's real pointer/mouse
events, and Firefox throttles background tabs so those events don't take effect until
the tab is focused. Approaches explored so far:

- Synthetic `Enter` keypress and a plain `element.click()` — ignored by the sites'
  editors.
- A full pointer+mouse click sequence — works, but only in the focused tab.
- Spoofing focus/visibility (`focus-spoof.js`, `document.hidden`/`hasFocus`
  overrides) — doesn't defeat the background-tab throttling.

Next candidate approach: have the extension briefly focus each tab in turn so each
submits while active (a short visible "flicker" through the tabs).

### Loading it

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click **Load Temporary Add-on** and select `extension/manifest.json`.

Temporary add-ons are removed when Firefox restarts; for a permanent install the
extension would need to be signed via [AMO](https://addons.mozilla.org/) /
`web-ext sign`.

### Requirements

- Firefox 128+ (Manifest V3; `focus-spoof.js` uses content-script `world: "MAIN"`)
- You must be logged in to each service for the prompt to submit.
