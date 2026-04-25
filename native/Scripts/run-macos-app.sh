#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_PATH="$("$ROOT/Scripts/build-macos-app.sh" | tail -n 1)"

open -n "$APP_PATH"
echo "Opened $APP_PATH"
