# Oscillo Native

Native Swift rewrite lane for Oscillo.

The current slice is intentionally separate from the existing Next/Three.js app. It provides:

- `OscilloCore`: shared vDSP-backed audio analysis, quality profiles, and deterministic note-field data.
- `OscilloMac`: a macOS SwiftUI + MetalKit app executable.
- Core XCTest coverage for the shared model and audio analysis contracts.
- `APPLE_TECH_MAP.md`: current Apple framework research and adoption plan.
- `DESIGN_DIRECTION.md`: native creative direction and non-parity guidance.
- `UPDATES.md`: GitHub release update channel and secure OTA path.

## Requirements

- Xcode 26.4.1 or newer
- Swift 6.2+

If `xcode-select` points at Command Line Tools, prefix commands with:

```bash
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
```

## Build And Test

```bash
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer swift test
```

```bash
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer swift build --product OscilloMac
```

```bash
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer swift run OscilloMac
```

To build a launchable macOS app bundle:

```bash
cd native
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer ./Scripts/build-macos-app.sh
open dist/Oscillo.app
```

To build and open it in one command:

```bash
cd native
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer ./Scripts/run-macos-app.sh
```

## GitHub CI And Releases

Native pull requests are checked by `.github/workflows/native-macos.yml`.

Native release builds are published by `.github/workflows/native-release.yml` using tags like `native-v0.1.0`.

See `UPDATES.md` for the current GitHub Releases update channel and the secure Sparkle OTA install path.

See `DESIGN_DIRECTION.md` before making visual or interaction decisions. The Swift app is allowed to diverge from the old Three.js experiment.

## Current Scope

The macOS executable opens a SwiftUI window backed by an `MTKView`. It renders an audio-reactive Metal scene using a preview signal by default and can attempt microphone input through `AVAudioEngine`. The visible control panel includes microphone/preview controls, palette selection, intensity, particle density, preview tempo, live audio meters, and a GitHub Releases update check. The bundle template includes `NSMicrophoneUsageDescription` plus sandboxed audio-input and outbound-network entitlements for local signing.

Durable next steps:

- Move shader source into compiled `.metal` files once the app target is packaged as an Xcode project.
- Add a renderer abstraction so a Metal 4 backend can coexist with the current MetalKit backend.
- Promote the bundle script into an Xcode app target once the app needs asset catalogs, schemes, and simulator destinations.
- Add an iOS target that reuses `OscilloCore` and the renderer contracts.
