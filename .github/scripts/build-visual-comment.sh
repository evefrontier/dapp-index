#!/usr/bin/env bash
# Renders the PR comment body for the site-visual CI job from the flattened
# asset tree produced by collect-visual-assets.sh.
#
# Required env vars:
#   ASSET_DIR       Path to the flattened asset tree (expected/actual/diff/pages.txt).
#   OUTPUT_FILE     Where to write the rendered markdown.
#   STATUS_LABEL    Human status line, e.g. "Passed" or "Failed".
#   RUN_URL         Link to the GitHub Actions run (artifact fallback).
#   GH_PAGES_OK     "true" if the gh-pages deploy step succeeded, else "false".
#   GH_PAGES_URL    Base gh-pages URL for this PR's assets (only read when GH_PAGES_OK=true).
set -euo pipefail

: "${ASSET_DIR:?ASSET_DIR is required}"
: "${OUTPUT_FILE:?OUTPUT_FILE is required}"
: "${STATUS_LABEL:?STATUS_LABEL is required}"
: "${RUN_URL:?RUN_URL is required}"
GH_PAGES_OK="${GH_PAGES_OK:-false}"
GH_PAGES_URL="${GH_PAGES_URL:-}"

PAGES_FILE="$ASSET_DIR/pages.txt"

cell() {
  # cell <variant> <page> — renders an image link when the file exists and
  # gh-pages hosting is available, otherwise a fallback note.
  local variant="$1" page="$2" file="$ASSET_DIR/$1/$2.png"
  if [ ! -f "$file" ]; then
    echo "—"
    return
  fi
  if [ "$GH_PAGES_OK" = "true" ] && [ -n "$GH_PAGES_URL" ]; then
    echo "[![${variant}](${GH_PAGES_URL}/${variant}/${page}.png)](${GH_PAGES_URL}/${variant}/${page}.png)"
  else
    echo "_see workflow artifacts_"
  fi
}

{
  echo "<!-- playwright-visual-regression -->"
  echo "## Frontend screenshots (Playwright)"
  echo
  echo "**Status:** ${STATUS_LABEL}"
  echo
  echo "**Full report:** download the \`playwright-report\` artifact from [this workflow run](${RUN_URL})."
  echo

  if [ ! -s "$PAGES_FILE" ]; then
    echo "_No visual-regression pages were captured for this run._"
  else
    if [ "$GH_PAGES_OK" != "true" ]; then
      echo "> GitHub Pages hosting is not available for this run (either not yet enabled for this repo, or the deploy step failed) — thumbnails are not embedded below. Download the \`playwright-report\` artifact linked above to view the actual/expected/diff images."
      echo
    fi

    echo "| Page | Expected | Actual | Diff |"
    echo "|------|----------|--------|------|"
    while IFS= read -r page; do
      [ -n "$page" ] || continue
      expected_cell="$(cell expected "$page")"
      actual_cell="$(cell actual "$page")"
      diff_cell="$(cell diff "$page")"
      echo "| ${page} | ${expected_cell} | ${actual_cell} | ${diff_cell} |"
    done < "$PAGES_FILE"
  fi
} > "$OUTPUT_FILE"
