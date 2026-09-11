#!/usr/bin/env bash
# Stream simulator logs for the Adler app subsystem.
set -euo pipefail
UDID="${SIMULATOR_UDID:-9D3C9873-0CF0-4D2F-ABA6-0E821CA3E044}"
BUNDLE_ID="com.withadler.app"

xcrun simctl spawn "$UDID" log stream --level debug --predicate "subsystem == \"$BUNDLE_ID\""
