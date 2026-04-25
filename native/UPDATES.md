# Native Update Channel

Oscillo now has the first GitHub-backed native update lane.

## Current Behavior

- `native/dist/Oscillo.app` is a local signed macOS app bundle.
- The app includes a visible `Check Updates` control.
- The update check calls GitHub Releases for `zachyzissou/Oscillo`.
- If a newer `native-vX.Y.Z` release exists, the app enables an `Open Release` button.
- Release builds publish a macOS zip asset and `oscillo-native-update.json` manifest.

This is enough for test builds on a MacBook Pro without pretending we have secure self-replacement yet.

## Release Flow

Manual release:

```bash
gh workflow run "Native macOS Release" --repo zachyzissou/Oscillo -f tag=native-v0.1.0
```

Tag release:

```bash
git tag native-v0.1.0
git push origin native-v0.1.0
```

Both paths build and publish:

- `Oscillo-macOS-<version>.zip`
- `Oscillo-macOS-<version>.zip.sha256`
- `oscillo-native-update.json`

## Secure OTA Install Path

For automatic in-app download/install, use Sparkle 2 once the project has a full Xcode app target and signing secrets.

Required future work:

- Add Sparkle as a Swift package or embedded framework in the Xcode app target.
- Generate and protect Sparkle EdDSA private key outside the repo.
- Add the Sparkle public key and appcast URL to app metadata.
- Use Developer ID signing and notarization for public MacBook installs.
- Publish Sparkle appcast assets from the native release workflow.

Sparkle is the right self-update mechanism for direct-distributed macOS apps. The current GitHub release check is the safe interim step.
