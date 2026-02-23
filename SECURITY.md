# Security Policy

## Supported Versions

We currently support and patch security issues for the latest branch only unless otherwise noted in tags/releases.

| Branch | Supported |
|---|---|
| `main` | Yes |
| `master` | Yes (legacy; migration candidate) |

If your repo uses a custom default branch, list it explicitly below:

- `<CUSTOM_BRANCH>`: Yes

## Reporting a vulnerability

Please report security issues privately. **Do not open public issues** for sensitive details.

- Email: `security@example.com`
- Response time target: **72 hours** for initial acknowledgement
- Disclosure timeline: coordinate with maintainer before public disclosure

Please include:
- Affected repository and commit/tag
- Reproduction steps
- Impact assessment
- Any proof-of-concept or logs

## Security expectations

- Store secrets in environment variables or secret managers (never commit `.env`, API keys, certs, or credentials)
- Use branch protection on default branch
- Enable least-privilege GitHub tokens in CI
- Run dependency/security scans in CI (Dependabot or equivalent)
- Keep CI logs free of secrets
- Rotate secrets after suspected leak

## Scope

This policy applies to:
- Source code and workflow files
- Third-party actions and dependencies
- Public issue/PR content containing sensitive details

Thank you for helping keep this project safe.
