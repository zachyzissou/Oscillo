#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

tmp_dir="${TMPDIR:-/tmp}"
failures="$(mktemp "${tmp_dir%/}/oscillo-secret-guard.XXXXXX")"
trap 'rm -f "$failures"' EXIT

while IFS= read -r file; do
  case "$file" in
    native/secrets/*)
      printf 'forbidden tracked signing material: %s\n' "$file" >> "$failures"
      ;;
    .env|.env.*|*/.env|*/.env.*)
      case "$file" in
        .env.example|*.example)
          ;;
        *)
          printf 'forbidden tracked environment file: %s\n' "$file" >> "$failures"
          ;;
      esac
      ;;
    *.p12|*.pfx|*.mobileprovision|*.provisionprofile|*.certSigningRequest|*.csr|*.key|*.pem)
      printf 'forbidden tracked credential-like file: %s\n' "$file" >> "$failures"
      ;;
  esac
done < <(git ls-files)

git grep -nI -E \
  -e '-----BEGIN (RSA |DSA |EC |OPENSSH |PGP )?PRIVATE KEY( BLOCK)?-----' \
  -e 'AKIA[0-9A-Z]{16}' \
  -e 'github_pat_[A-Za-z0-9_]{20,}' \
  -e 'gh[pousr]_[A-Za-z0-9_]{30,}' \
  -e 'xox[baprs]-[A-Za-z0-9-]{20,}' \
  -- . ':!package-lock.json' ':!native/Package.resolved' \
  >> "$failures" || true

if [[ -s "$failures" ]]; then
  echo "Tracked secret guard failed. Remove these files or rotate the exposed credential before pushing:" >&2
  cat "$failures" >&2
  exit 1
fi

echo "Tracked secret guard passed."
