#!/usr/bin/env bash
# Run AdlerTests (unit tests). Pass --ui to run AdlerUITests instead.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
UDID="${SIMULATOR_UDID:-9D3C9873-0CF0-4D2F-ABA6-0E821CA3E044}"
DERIVED_DATA="${DERIVED_DATA:-$IOS_DIR/.build}"

TARGET="AdlerTests"
if [ "${1:-}" = "--ui" ]; then
  TARGET="AdlerUITests"
fi

# The fixtures under AdlerTests/Fixtures must match docs/ios-api-examples, or the
# decoding tests assert against a contract the server no longer serves.
"$SCRIPT_DIR/check-fixtures.sh"

# Always regenerate: `sources: - path: Adler` is an XcodeGen group, so a test file
# added since the last generation is not in the project and reports
# "Executed 0 tests" while still exiting 0.
"$SCRIPT_DIR/generate.sh"

LOG="$(mktemp -t adler-test)"
set +e
xcodebuild \
  -project "$IOS_DIR/Adler.xcodeproj" \
  -scheme Adler \
  -destination "platform=iOS Simulator,id=$UDID" \
  -derivedDataPath "$DERIVED_DATA" \
  -only-testing:"$TARGET" \
  test 2>&1 | tee "$LOG" | grep -E "^(Test Suite |Test Case |Executed |\*\* )|error:|warning: " || true
STATUS=${PIPESTATUS[0]}
set -e

if [ "$STATUS" -ne 0 ]; then
  echo "error: xcodebuild test failed (exit $STATUS). Full log: $LOG" 1>&2
  tail -40 "$LOG" 1>&2
  exit "$STATUS"
fi

# A green run that executed nothing is a false pass — usually a target that was
# never regenerated, or an -only-testing filter that matches no test.
if grep -q "Executed 0 tests" "$LOG"; then
  echo "error: $TARGET executed 0 tests. Log: $LOG" 1>&2
  exit 1
fi
if ! grep -qE "Executed [0-9]+ test" "$LOG"; then
  echo "error: $TARGET reported no test summary at all. Log: $LOG" 1>&2
  exit 1
fi

rm -f "$LOG"
