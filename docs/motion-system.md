# Motion System Guidelines

This document defines the interaction-motion rules for Oscillo's primary UI journey (`Start -> Create -> Control`) and the reduced-motion equivalent behavior.

## 1. Motion Tokens

Motion tokens are defined in `src/styles/globals.css`.

| Token | Default | Reduced motion | Usage |
|---|---:|---:|---|
| `--motion-duration-fast` | `140ms` | `80ms` | Hover and focus feedback |
| `--motion-duration-standard` | `220ms` | `120ms` | State transitions |
| `--motion-duration-slow` | `320ms` | `160ms` | Entry transitions |
| `--motion-ease-standard` | `cubic-bezier(0.22, 1, 0.36, 1)` | same | General UI interpolation |
| `--motion-ease-emphasis` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | same | Hover emphasis |
| `--motion-lift-distance` | `-2px` | `0px` | Hover spatial lift |
| `--motion-enter-distance` | `10px` | `0px` | Entry offset |
| `--motion-focus-brightness` | `1.08` | `1` | Non-spatial focus/hover emphasis |

## 2. Interaction Rules

1. Entrance: surfaces should fade in with a short Y-offset (`--motion-enter-distance`) and no scale overshoot beyond subtle emphasis.
2. Hover: use slight lift (`--motion-lift-distance`) plus border/background changes, never large movement.
3. State change: rely on color, border, and elevation transitions using `--motion-duration-standard`.
4. Continuous/ambient motion: keep subtle and optional; must stop under reduced motion.

## 3. Reduced-Motion Behavior

Reduced motion is not a full "unstyled" mode. Instead:

1. Spatial movement is removed (`--motion-lift-distance: 0`, `--motion-enter-distance: 0`).
2. Continuous animations are disabled.
3. Clarity is preserved with static alternatives:
   - stronger borders
   - simpler shadows
   - unchanged interaction affordance via color/contrast

## 4. Applied Surfaces (Current)

- `src/components/ui/SimpleStartOverlay.module.css`
- `src/components/ui/ExperienceCommandDeck.module.css`
- `src/components/TelemetryConsentBanner.module.css`

These components now share tokenized motion timing/easing and explicit reduced-motion alternatives.
