# Accessibility Patterns

This document captures the baseline accessibility interaction patterns for Oscillo's core experience surfaces.

## Focus Treatment

- All primary controls use a shared high-contrast focus outline token:
  - `--a11y-focus-outline-color`
  - `--a11y-focus-outline-width`
  - `--a11y-focus-outline-offset`
- The same focus treatment is applied across:
  - start overlay CTA
  - telemetry consent actions
  - command deck controls (rail, sheet snaps, selects, segmented buttons, mode pills)
- High-contrast system preference overrides focus token values in `src/styles/globals.css`.

## Deterministic Keyboard Paths

- Start overlay: start button receives initial focus.
- Telemetry banner: `Allow` receives focus when banner appears; `Tab` moves to `Not now`.
- Telemetry choice completion: focus returns to the persistent deck rail toggle for continuity.
- Command deck: collapse/open interactions preserve focus targets (`open` button and primary key select).

## Screen Reader Announcements

- A shared global live region is mounted via `src/components/ui/AccessibilityAnnouncer.tsx`.
- Core surfaces publish key state changes through `useAccessibilityAnnouncements`:
  - start overlay readiness and startup result
  - telemetry consent result
  - command deck expand/collapse, mobile sheet snap changes, mode changes, onboarding completion

## Test Coverage

- `tests/e2e/accessibility.spec.ts` verifies:
  - deterministic keyboard flow
  - consistent focus indicators across core surfaces
  - reduced-motion behavior
  - live-region announcement updates for key state transitions
