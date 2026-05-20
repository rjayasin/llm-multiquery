#!/usr/bin/env bash
#
# multiquery.sh — fan a single prompt out to Claude.ai, Gemini, and ChatGPT,
# each in its own new browser tab.
#
# Usage:
#   ./multiquery.sh "your question here"
#   ./multiquery.sh your question here     # bare words also work
#
# Notes:
#   - Claude.ai and ChatGPT accept a ?q= param that prefills AND submits.
#   - Gemini's web app has no such param, so we open a fresh chat and put the
#     prompt on the clipboard; just hit Cmd+V to paste it.

set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: $0 \"your query\"" >&2
  exit 1
fi

# Join all args into one query string.
query="$*"

# URL-encode the query (RFC 3986) using a small Python helper, which is always
# present on macOS.
encoded=$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=""))' "$query")

claude_url="https://claude.ai/new?q=${encoded}"
chatgpt_url="https://chatgpt.com/?q=${encoded}"
gemini_url="https://gemini.google.com/app"

# Put the prompt on the clipboard for the Gemini tab (paste with Cmd+V).
printf '%s' "$query" | pbcopy

# Open each in a new tab in the default browser.
open "$claude_url"
open "$chatgpt_url"
open "$gemini_url"

echo "Opened Claude, ChatGPT, and Gemini tabs."
echo "Gemini has no prefill URL — the prompt is on your clipboard, paste with Cmd+V."
