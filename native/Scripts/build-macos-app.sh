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
FRAMEWORKS_DIR="$CONTENTS_DIR/Frameworks"
INFO_PLIST="$ROOT/AppBundle/Info.plist"
ENTITLEMENTS="$ROOT/AppBundle/OscilloMac.entitlements"
CODE_SIGN_IDENTITY="${CODE_SIGN_IDENTITY:--}"

sign_item() {
  if [[ "$CODE_SIGN_IDENTITY" = "-" ]]; then
    codesign --force --sign "$CODE_SIGN_IDENTITY" "$@"
  else
    codesign --force --sign "$CODE_SIGN_IDENTITY" --timestamp --options runtime "$@"
  fi
}

case "$CONFIGURATION" in
  debug|release)
    ;;
  *)
    echo "CONFIGURATION must be debug or release" >&2
    exit 64
    ;;
esac

swift build --configuration "$CONFIGURATION" --product "$PRODUCT"
BIN_PATH="$(swift build --configuration "$CONFIGURATION" --show-bin-path)"
EXECUTABLE="$BIN_PATH/$PRODUCT"
SPARKLE_FRAMEWORK="$BIN_PATH/Sparkle.framework"

if [[ ! -x "$EXECUTABLE" ]]; then
  echo "Expected executable not found: $EXECUTABLE" >&2
  exit 66
fi

if [[ ! -d "$SPARKLE_FRAMEWORK" ]]; then
  echo "Expected Sparkle framework not found: $SPARKLE_FRAMEWORK" >&2
  exit 66
fi

rm -rf "$APP_DIR"
mkdir -p "$MACOS_DIR" "$RESOURCES_DIR" "$FRAMEWORKS_DIR"

cp "$INFO_PLIST" "$CONTENTS_DIR/Info.plist"
printf "APPL????" > "$CONTENTS_DIR/PkgInfo"
cp "$EXECUTABLE" "$MACOS_DIR/$PRODUCT"
ditto "$SPARKLE_FRAMEWORK" "$FRAMEWORKS_DIR/Sparkle.framework"
chmod +x "$MACOS_DIR/$PRODUCT"

plutil -lint "$CONTENTS_DIR/Info.plist" >/dev/null

if ! otool -l "$MACOS_DIR/$PRODUCT" | grep -q "@executable_path/../Frameworks"; then
  install_name_tool -add_rpath "@executable_path/../Frameworks" "$MACOS_DIR/$PRODUCT"
fi

SPARKLE_APP_FRAMEWORK="$FRAMEWORKS_DIR/Sparkle.framework"
SPARKLE_CURRENT_VERSION_DIR="$SPARKLE_APP_FRAMEWORK/Versions/Current"
sign_item "$SPARKLE_CURRENT_VERSION_DIR/XPCServices/Installer.xpc" >/dev/null
sign_item --preserve-metadata=entitlements "$SPARKLE_CURRENT_VERSION_DIR/XPCServices/Downloader.xpc" >/dev/null
sign_item "$SPARKLE_CURRENT_VERSION_DIR/Autoupdate" >/dev/null
sign_item "$SPARKLE_CURRENT_VERSION_DIR/Updater.app" >/dev/null
sign_item "$SPARKLE_APP_FRAMEWORK" >/dev/null
sign_item --entitlements "$ENTITLEMENTS" "$APP_DIR" >/dev/null
codesign --verify --deep --strict "$APP_DIR"

echo "$APP_DIR"
