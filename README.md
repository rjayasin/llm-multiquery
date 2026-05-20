# llm-multiquery

A small macOS script that fans a single prompt out to **Claude.ai**, **ChatGPT**,
and **Gemini** at once — each opening in its own new browser tab.

## Usage

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
