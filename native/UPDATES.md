# Native Update Channel

Oscillo has a GitHub-backed native update lane plus a Sparkle OTA install path.

## Current Behavior

- `native/dist/Oscillo.app` is a local signed macOS app bundle.
- The app includes a visible `Check Updates` control.
- The update check calls GitHub Releases for `zachyzissou/Oscillo`.
- If a newer `native-vX.Y.Z` release exists, the app enables an `Open Release` button.
- Release builds publish a notarized macOS zip asset, `oscillo-native-update.json`, and a Sparkle `oscillo-appcast.xml`.
- Sparkle uses the appcast to download and install signed updates in-app.

The GitHub release check remains in the UI as a visible status and fallback path. Sparkle handles the actual OTA install flow.

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
- `oscillo-appcast.xml`

## Signing and Notarization

GitHub native releases require Apple Developer ID signing and notarization secrets before publishing update assets:

- `MACOS_DEVELOPER_ID_APPLICATION_P12_BASE64`: base64-encoded `.p12` export for a `Developer ID Application` certificate.
- `MACOS_DEVELOPER_ID_APPLICATION_P12_PASSWORD`: password for the `.p12` export.
- `APPLE_ID`: Apple ID used for notarization.
- `APPLE_APP_SPECIFIC_PASSWORD`: app-specific password for `notarytool`.
- `APPLE_TEAM_ID`: Apple Developer Program team ID.
- `SPARKLE_ED_PRIVATE_KEY`: Sparkle EdDSA private key for signing appcast update items.

The matching Sparkle public key lives in `AppBundle/Info.plist` as `SUPublicEDKey`.

Developer ID signing plus notarization is what prevents the recurring Gatekeeper "Open Anyway" approval flow for direct-download builds. Sparkle's EdDSA signature protects the update feed and archive, but it does not replace Apple's Gatekeeper trust chain.

## First-Time Secret Setup

Generate a Developer ID Application certificate from the Apple Developer portal using the CSR at:

```bash
native/secrets/OscilloDeveloperIDApplication.certSigningRequest
```

After downloading the `.cer`, store the release secrets:

```bash
APPLE_ID="you@example.com" \
APPLE_TEAM_ID="TEAMID" \
APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx" \
native/Scripts/configure-macos-signing-secrets.sh /path/to/developer_id_application.cer
```

The script builds a password-protected `.p12` from the local private key, pushes the GitHub secrets, and leaves the generated key material under ignored `native/secrets/`.

Before pushing release changes, run the tracked-file secret guard:

```bash
bash native/Scripts/check-no-secrets.sh
```

The guard scans files already tracked by Git and fails if signing material, real `.env` files, private-key blocks, or common credential token formats are present in the repository.
