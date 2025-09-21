# Pull Request

## Summary

- What does this PR change and why?
- Linked issue(s): Fixes #

## Screenshots / Videos (UI/3D)

- Before:
- After:

## Checklist

- [ ] Branch named `feature/<task>` or `fix/<scope>`
- [ ] TypeScript passes: `npm run type-check`
- [ ] Lint passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass: `npm test` (and E2E if applicable)
- [ ] No paid/licensed assets introduced
- [ ] SSR/hydration safe (browser-only code guarded; client files start with `"use client"` when needed)
- [ ] Audio init is user-gesture gated (Tone.js)
- [ ] Performance/memory verified (desktop + mobile); note any trade-offs
- [ ] Updated docs (README/AGENTS.md/CONTRIBUTING.md) if behavior or APIs changed

## Implementation Notes

- Architecture decisions
- Alternatives considered
- Risk/impact

## QA Instructions

- Steps to verify locally
- Edge cases to test
