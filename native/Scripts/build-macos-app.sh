#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIGURATION="${CONFIGURATION:-debug}"
PRODUCT="OscilloMac"
APP_NAME="Oscillo"
APP_DIR="$ROOT/dist/$APP_NAME.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"
INFO_PLIST="$ROOT/AppBundle/Info.plist"
ENTITLEMENTS="$ROOT/AppBundle/OscilloMac.entitlements"

case "$CONFIGURATION" in
  debug|release)
    ;;
  *)
    echo "CONFIGURATION must be debug or release" >&2
    exit 64
    ;;
esac

swift build --configuration "$CONFIGURATION" --product "$PRODUCT"
BIN_PATH="$ROOT/.build/$CONFIGURATION"
EXECUTABLE="$BIN_PATH/$PRODUCT"

if [[ ! -x "$EXECUTABLE" ]]; then
  echo "Expected executable not found: $EXECUTABLE" >&2
  exit 66
fi

rm -rf "$APP_DIR"
mkdir -p "$MACOS_DIR" "$RESOURCES_DIR"

cp "$INFO_PLIST" "$CONTENTS_DIR/Info.plist"
printf "APPL????" > "$CONTENTS_DIR/PkgInfo"
cp "$EXECUTABLE" "$MACOS_DIR/$PRODUCT"
chmod +x "$MACOS_DIR/$PRODUCT"

plutil -lint "$CONTENTS_DIR/Info.plist" >/dev/null
codesign --force --sign - --entitlements "$ENTITLEMENTS" "$APP_DIR" >/dev/null
codesign --verify --deep --strict "$APP_DIR"

echo "$APP_DIR"
