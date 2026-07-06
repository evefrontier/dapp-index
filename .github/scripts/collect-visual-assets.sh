#!/usr/bin/env bash
# Flattens Playwright's visual-regression output into a small, predictable
# tree that the CI workflow can publish to gh-pages and/or upload as an
# artifact:
#
#   site/visual-regression/
#     expected/<page>.png   (committed baseline, from site/e2e/__screenshots__)
#     actual/<page>.png     (only present for failed comparisons)
#     diff/<page>.png       (only present for failed comparisons)
#     pages.txt             (sorted, de-duplicated list of <page> names)
#
# Run from the repo root. Safe to run even if no assets exist (e.g. the job
# was skipped or the build failed before Playwright ran).
set -euo pipefail

BASELINE_DIR="site/e2e/__screenshots__"
RESULTS_DIR="site/test-results"
ASSET_DIR="site/visual-regression"

rm -rf "$ASSET_DIR"
mkdir -p "$ASSET_DIR/expected" "$ASSET_DIR/actual" "$ASSET_DIR/diff"

# Only Linux baselines are committed (see site/AGENTS.md); that suffix is the
# stable "page name" boundary.
if [ -d "$BASELINE_DIR" ]; then
  while IFS= read -r -d '' file; do
    name="$(basename "$file")"
    page="${name%-chromium-linux.png}"
    cp "$file" "$ASSET_DIR/expected/${page}.png"
  done < <(find "$BASELINE_DIR" -name '*-chromium-linux.png' -print0)
fi

if [ -d "$RESULTS_DIR" ]; then
  while IFS= read -r -d '' file; do
    name="$(basename "$file")"
    page="${name%-actual.png}"
    cp "$file" "$ASSET_DIR/actual/${page}.png"
  done < <(find "$RESULTS_DIR" -name '*-actual.png' -print0)

  while IFS= read -r -d '' file; do
    name="$(basename "$file")"
    page="${name%-diff.png}"
    cp "$file" "$ASSET_DIR/diff/${page}.png"
  done < <(find "$RESULTS_DIR" -name '*-diff.png' -print0)
fi

{
  ls "$ASSET_DIR/expected" 2>/dev/null || true
  ls "$ASSET_DIR/actual" 2>/dev/null || true
  ls "$ASSET_DIR/diff" 2>/dev/null || true
} | sed -n 's/\.png$//p' | sort -u > "$ASSET_DIR/pages.txt"

page_count=$(wc -l < "$ASSET_DIR/pages.txt" | tr -d '[:space:]')
echo "Collected visual-regression assets for ${page_count} page(s)."
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "has_assets=$([ "$page_count" -gt 0 ] && echo true || echo false)" >> "$GITHUB_OUTPUT"
fi
