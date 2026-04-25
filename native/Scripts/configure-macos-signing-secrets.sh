#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPOSITORY="${REPOSITORY:-zachyzissou/Oscillo}"
SECRETS_DIR="$ROOT/secrets"
KEY_PATH="${KEY_PATH:-$SECRETS_DIR/OscilloDeveloperIDApplication.key}"
P12_PATH="${P12_PATH:-$SECRETS_DIR/OscilloDeveloperIDApplication.p12}"
P12_PASSWORD_PATH="${P12_PASSWORD_PATH:-$SECRETS_DIR/OscilloDeveloperIDApplication.p12.password}"

usage() {
  cat >&2 <<'EOF'
Usage:
  APPLE_ID=you@example.com \
  APPLE_TEAM_ID=TEAMID \
  APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx \
  ./Scripts/configure-macos-signing-secrets.sh /path/to/developer_id_application.cer

The matching private key must exist at native/secrets/OscilloDeveloperIDApplication.key.
EOF
}

if [[ $# -ne 1 ]]; then
  usage
  exit 64
fi

CER_PATH="$1"
if [[ ! -f "$CER_PATH" ]]; then
  echo "Certificate file not found: $CER_PATH" >&2
  exit 66
fi

if [[ ! -f "$KEY_PATH" ]]; then
  echo "Developer ID private key not found: $KEY_PATH" >&2
  exit 66
fi

if [[ -z "${APPLE_ID:-}" || -z "${APPLE_TEAM_ID:-}" || -z "${APPLE_APP_SPECIFIC_PASSWORD:-}" ]]; then
  echo "APPLE_ID, APPLE_TEAM_ID, and APPLE_APP_SPECIFIC_PASSWORD must be set." >&2
  usage
  exit 64
fi

mkdir -p "$SECRETS_DIR"
chmod 700 "$SECRETS_DIR"

cert_pem="$SECRETS_DIR/OscilloDeveloperIDApplication.pem"
if openssl x509 -inform DER -in "$CER_PATH" -noout >/dev/null 2>&1; then
  openssl x509 -inform DER -in "$CER_PATH" -out "$cert_pem"
else
  openssl x509 -in "$CER_PATH" -out "$cert_pem"
fi

cert_modulus="$(openssl x509 -noout -modulus -in "$cert_pem" | openssl dgst -sha256)"
key_modulus="$(openssl rsa -noout -modulus -in "$KEY_PATH" 2>/dev/null | openssl dgst -sha256)"
if [[ "$cert_modulus" != "$key_modulus" ]]; then
  echo "The certificate does not match $KEY_PATH. Recreate the certificate with the CSR in native/secrets." >&2
  exit 65
fi

p12_password="${MACOS_DEVELOPER_ID_APPLICATION_P12_PASSWORD:-$(openssl rand -base64 36)}"
printf '%s' "$p12_password" > "$P12_PASSWORD_PATH"
chmod 600 "$P12_PASSWORD_PATH"

openssl pkcs12 -export \
  -inkey "$KEY_PATH" \
  -in "$cert_pem" \
  -out "$P12_PATH" \
  -passout "pass:$p12_password" >/dev/null
chmod 600 "$P12_PATH"

base64_path="$SECRETS_DIR/OscilloDeveloperIDApplication.p12.base64"
base64 -i "$P12_PATH" | tr -d '\n' > "$base64_path"
chmod 600 "$base64_path"

gh secret set MACOS_DEVELOPER_ID_APPLICATION_P12_BASE64 --repo "$REPOSITORY" < "$base64_path"
printf '%s' "$p12_password" | gh secret set MACOS_DEVELOPER_ID_APPLICATION_P12_PASSWORD --repo "$REPOSITORY"
printf '%s' "$APPLE_ID" | gh secret set APPLE_ID --repo "$REPOSITORY"
printf '%s' "$APPLE_TEAM_ID" | gh secret set APPLE_TEAM_ID --repo "$REPOSITORY"
printf '%s' "$APPLE_APP_SPECIFIC_PASSWORD" | gh secret set APPLE_APP_SPECIFIC_PASSWORD --repo "$REPOSITORY"

echo "Stored macOS signing and notarization secrets for $REPOSITORY."
echo "Local p12: $P12_PATH"
