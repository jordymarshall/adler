#!/usr/bin/env bash
# Copy the server's example payloads into the test bundle's resources.
#
# docs/ios-api-examples/*.json is generated from a fictional account by
#   npx tsx scripts/app-api-examples.ts
# and is the authority for what the app must decode. AdlerTests/Fixtures/ is a
# verbatim copy so the unit tests can read them from the test bundle.
#
# Run this after regenerating the examples, then `ios/scripts/test.sh`.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_DIR="$(cd "$IOS_DIR/.." && pwd)"
SOURCE="$REPO_DIR/docs/ios-api-examples"
DEST="$IOS_DIR/AdlerTests/Fixtures"

if [ ! -d "$SOURCE" ]; then
  echo "error: $SOURCE not found. Run: npx tsx scripts/app-api-examples.ts" 1>&2
  exit 1
fi

mkdir -p "$DEST"
# Remove copies whose source is gone, so a deleted example cannot linger green.
for existing in "$DEST"/*.json; do
  [ -e "$existing" ] || continue
  if [ ! -e "$SOURCE/$(basename "$existing")" ]; then
    rm "$existing"
    echo "removed $(basename "$existing")"
  fi
done

count=0
for file in "$SOURCE"/*.json; do
  cp "$file" "$DEST/$(basename "$file")"
  count=$((count + 1))
done

echo "synced $count fixture(s) → AdlerTests/Fixtures"
