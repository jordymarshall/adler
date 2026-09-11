#!/usr/bin/env bash
# Build Adler for the simulator. Prints the built .app path on stdout
# (build log goes to stderr so the path can be captured with $(...)).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
UDID="${SIMULATOR_UDID:-9D3C9873-0CF0-4D2F-ABA6-0E821CA3E044}"
DERIVED_DATA="${DERIVED_DATA:-$IOS_DIR/.build}"

# Always regenerate: project.yml lists `Adler` as an XcodeGen *group*, so the file
# list is frozen at generation time and a source file added since would be
# silently dropped from the build. `xcodegen generate` is idempotent and fast.
"$SCRIPT_DIR/generate.sh" 1>&2

xcodebuild \
  -project "$IOS_DIR/Adler.xcodeproj" \
  -scheme Adler \
  -destination "platform=iOS Simulator,id=$UDID" \
  -derivedDataPath "$DERIVED_DATA" \
  -quiet \
  build 1>&2

APP_PATH="$DERIVED_DATA/Build/Products/Debug-iphonesimulator/Adler.app"
if [ ! -d "$APP_PATH" ]; then
  echo "error: build succeeded but app bundle not found at $APP_PATH" 1>&2
  exit 1
fi

echo "$APP_PATH"
