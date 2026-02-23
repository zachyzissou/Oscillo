# Pre-PR Checklist

Use this checklist before requesting review on any feature/fix PR.

## 1) Core Gate (Required)
- [ ] `npm run lint:check`
- [ ] `npm run type-check`
- [ ] `npm test -- --run` (or targeted test + rationale)
- [ ] For UI-affecting changes: `npm run test:smoke`

## 2) Recurring Review Traps
- [ ] No `console.*` clusters in changed paths; use structured `logger` events.
- [ ] Runtime guards accept `unknown` and validate shape explicitly.
- [ ] Guard tests include edge cases (null, array/object mismatch, boundary lengths, negative numeric cases).
- [ ] No insecure or misleading test fixtures (for example, insecure protocol placeholders that trigger security tooling noise).
- [ ] Hydration-sensitive UI avoids first-frame localStorage/window mismatches.
- [ ] Accessibility basics covered for changed surfaces:
  - [ ] keyboard path works end-to-end
  - [ ] focus target is deterministic
  - [ ] reduced-motion behavior is respected when motion exists

## 3) PR Hygiene
- [ ] PR description includes:
  - [ ] scope summary
  - [ ] verification commands run
  - [ ] issue link (`Closes #...`)
- [ ] If part of an execution plan, include timing/throughput note where requested.
- [ ] Request Copilot review (`@copilot review`) and close helper PRs (`copilot/sub-pr-*`) if auto-created.
- [ ] Resolve all actionable review threads with explicit `fixed` or `why not` responses.

## 4) CI Triage Ready
- [ ] If checks fail, follow `docs/ci-failure-triage.md`.
- [ ] Capture run URL, failing step, and first actionable error snippet in issue/PR thread.

## Suggested Local Run Sequence
### Non-UI changes
```bash
npm run lint:check
npm run type-check
npm test -- --run
```

### UI-affecting changes
```bash
npm run lint:check
npm run type-check
npm test -- --run
npm run test:smoke
```
