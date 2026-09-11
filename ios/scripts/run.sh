#!/usr/bin/env bash
# Build (if needed), boot the simulator (if needed), install and launch Adler.
# Usage: run.sh [--url adler://...]
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UDID="${SIMULATOR_UDID:-9D3C9873-0CF0-4D2F-ABA6-0E821CA3E044}"
BUNDLE_ID="com.withadler.app"

URL=""
if [ "${1:-}" = "--url" ]; then
  URL="${2:-}"
fi

APP_PATH="$("$SCRIPT_DIR/build.sh")"

if ! xcrun simctl list devices | grep "$UDID" | grep -q "Booted"; then
  echo "Booting simulator $UDID..."
  xcrun simctl boot "$UDID"
  xcrun simctl bootstatus "$UDID" -b
fi

xcrun simctl install "$UDID" "$APP_PATH"
xcrun simctl launch "$UDID" "$BUNDLE_ID"

if [ -n "$URL" ]; then
  sleep 1
  xcrun simctl openurl "$UDID" "$URL"
fi

echo "Launched $BUNDLE_ID on $UDID"
