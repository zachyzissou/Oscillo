# Scene Orchestration Contracts

## Goal
Split scene orchestration into focused modules so rendering concerns evolve independently from UI/control concerns.

## Current Module Boundaries

| Module | Responsibility | Inputs | Outputs |
| --- | --- | --- | --- |
| `src/components/ImmersiveMusicalUniverse.tsx` | Application orchestration and UI composition | `hasUserInteracted`, `perfLevel` | Chooses placeholder vs canvas, mounts overlays/managers |
| `src/components/scene/MusicalCanvas.tsx` | Three.js canvas bootstrapping and renderer config | `perfLevel`, `profile`, `children` | Configured `<Canvas data-testid="webgl-canvas">` with fog/background |
| `src/components/scene/MusicalSceneContent.tsx` | Scene graph composition (lights, environment, controls) | `perfLevel`, `starCountScale` | Stable interactive scene subtree |
| `src/components/scene/SpiralNoteField.tsx` | Note object generation + particle/morphing geometry | `scaleNotes` store selector | Rendered particle note systems + morphing meshes |
| `src/components/scene/MovingAccentLights.tsx` | Animated accent light rig | frame clock from R3F | Rotating point-light group |

## Shared State Contracts

- `useAudioEngine(state => state.hasUserInteracted)`
  - Controls whether the scene canvas can mount.
  - Prevents rendering stack from coupling to startup-overlay internals.
- `usePerformanceSettings(state => state.level)`
  - Single source for quality profile lookup.
  - Feeds `MusicalCanvas` (renderer config) and `MusicalSceneContent` (environment density).
- `QUALITY_PROFILES`
  - Contract shape: `{ dpr, starCountScale, shadows, postprocessing }`.
  - Keeps quality tuning data centralized and testable.

## Invariants

- `webgl-canvas` test id remains on the concrete `<Canvas>` element.
- Start gate remains required for each page load before scene interactivity.
- UI overlays (`SimpleStartOverlay`, command deck, telemetry) stay outside scene-render modules.

## Extension Guidance

- Add new scene effects inside `MusicalSceneContent` or a child module, not in `ImmersiveMusicalUniverse`.
- Add renderer-level flags in `MusicalCanvas` when they affect WebGL initialization.
- Add new global control/store dependencies in the orchestration layer first, then pass explicit props into scene modules.
