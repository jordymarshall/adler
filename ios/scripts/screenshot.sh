#!/usr/bin/env bash
# Save a simulator screenshot to .context/shots/<name>.png
# Usage: screenshot.sh <name>
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_DIR="$(cd "$IOS_DIR/.." && pwd)"
UDID="${SIMULATOR_UDID:-9D3C9873-0CF0-4D2F-ABA6-0E821CA3E044}"

NAME="${1:?usage: screenshot.sh <name>}"
OUT_DIR="$REPO_DIR/.context/shots"
mkdir -p "$OUT_DIR"
OUT_PATH="$OUT_DIR/$NAME.png"

xcrun simctl io "$UDID" screenshot "$OUT_PATH"
echo "$OUT_PATH"
