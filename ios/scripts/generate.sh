#!/usr/bin/env bash
# Regenerate Adler.xcodeproj from project.yml.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$IOS_DIR"
xcodegen generate
