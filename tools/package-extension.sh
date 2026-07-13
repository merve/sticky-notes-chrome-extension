#!/usr/bin/env bash
# Packages the extension into a Chrome Web Store-ready zip.
# Usage: ./tools/package-extension.sh
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

version=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
out="sticky-notes-$version.zip"

rm -f "$out"
zip -r -X "$out" \
  manifest.json \
  popup.html \
  dashboard.html \
  scripts \
  styles \
  assets \
  -x "**/.DS_Store"

echo "Packaged $out"
