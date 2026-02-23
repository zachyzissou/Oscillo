# Security And Branch Governance

## CI Security Audit Gate

Security is enforced as a first-class CI job in `.github/workflows/ci.yml`:

- Job: `security-audit`
- Command: `npm audit --audit-level <threshold> --json`
- Default threshold: `high`
- Config override: repository variable `SECURITY_AUDIT_LEVEL`
- Artifact: `security-audit-report` (`security-audit-report.json`)

Accepted threshold values should match `npm audit` levels:
- `critical`
- `high`
- `moderate`
- `low`

## Transitive Vulnerability Policy

Default policy on `main`:
- No unresolved `high` or `critical` vulnerabilities.
- `moderate` and below are permitted only when risk is understood and tracked.

If a transitive high cannot be fixed immediately (for example, upstream-blocked):
1. Open a dedicated issue with explicit package path and advisory link.
1. Add mitigation details (override, isolation, feature flag, or operational control).
1. Set an owner and target date for reevaluation.
1. Link the issue from the release/security report before shipping.

## Main Branch Protection Decision

Decision for `main`:
- `main` remains protected by required status checks (including baseline and security gates).
- Merges should use policy-compliant flow first (standard merge/auto-merge when available).
- Admin override merges are allowed only as an exception path and must include a PR comment describing why policy-compliant merge could not be used.

This keeps governance strict while allowing operational recovery when GitHub ruleset behavior blocks normal automation.
