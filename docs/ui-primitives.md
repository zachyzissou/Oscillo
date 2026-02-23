# UI Primitives

## Purpose
Oscillo now centralizes core surface and control behavior behind reusable primitives so start flow and overlays can share one interaction baseline.

## Components
- `UIOverlay` (`/src/components/ui/primitives/UiPrimitives.tsx`)
  - Full-screen fixed overlay shell used by start flow dialogs.
- `UISurface` (`/src/components/ui/primitives/UiPrimitives.tsx`)
  - Tokenized surface container with tone variants: `panel`, `dialog`, `banner`, `sheet`.
- `UIButton` (`/src/components/ui/primitives/UiPrimitives.tsx`)
  - Tokenized button with tone variants: `primary`, `secondary`, `ghost`, and shapes: `rounded`, `pill`.

## Token Layer
Primitive tokens live in `src/styles/globals.css` under `:root`:
- Radius: `--ui-radius-sm`, `--ui-radius-md`, `--ui-radius-lg`, `--ui-radius-xl`
- Surface: `--ui-border-subtle`, `--ui-surface-elevated`, `--ui-shadow-elevated`
- Button: `--ui-button-*`

High-contrast mode overrides these tokens in the same file.

## Current Adoption
- `SimpleStartOverlay` uses `UIOverlay`, `UISurface`, and `UIButton`.
- `TelemetryConsentBanner` uses `UISurface` and `UIButton`.
- `AudioRecoveryBanner` uses `UISurface` and `UIButton`.
- `ExperienceCommandDeck` shell uses `UISurface`.

## Usage Rule
New modal/banner/sheet/button work should start from primitives and only add local CSS for content-specific layout or brand flourishes.
