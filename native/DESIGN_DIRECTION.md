# Native Design Direction

The Swift rewrite is not a strict port of the pre-native Three.js experiment.

The web app is useful source material for the domain: audio reactivity, visual synthesis, musical controls, and exploratory play. It should not be treated as the final layout, visual language, interaction model, or feature checklist for the native app.

Google Stitch exploration for this direction lives in [`docs/STITCH_WORKFLOW.md`](../docs/STITCH_WORKFLOW.md).

## Product North Star

Oscillo Native should feel like a living instrument for sound-driven light.

It should be immediate enough to open on a MacBook Pro and play with in seconds, but deep enough that each control changes the character of the scene. The app should feel native to Apple platforms: fast, tactile, precise, and visually rich without copying a web HUD.

## Operating Definition

Oscillo is a real-time creative instrument where audio analysis, visual synthesis, and performance controls are one playable surface.

It should not behave like a passive visualizer, a media player, a DAW clone, a SaaS dashboard, or a marketing site. The native app should open directly into an instrument state: preview or microphone signal is available, the Metal scene is alive, and compact controls let the user shape how sound becomes motion, color, topology, and spatial behavior.

The pre-Swift app defines the domain more than the destination. Its important ideas are audio reactivity, interactive 3D music play, AI composition potential, spatial rendering, and collaborative jam-session ambition. The Swift app should grow those ideas through Apple-native tools and interaction patterns instead of recreating the web layout or every old panel.

## Creative Principles

- Prefer native interaction patterns over web parity.
- Let audio shape motion, topology, color, and camera behavior, not only brightness.
- Make the first screen the instrument, not an explanatory landing page.
- Keep controls compact and inspectable; the scene should own most of the window.
- Maintain a single primary control surface. Secondary overlays should be readouts only, and layout must reserve space so controls never compete with the scene or each other.
- Use Metal for visual identity, not just as a Three.js replacement.
- Do not expose controls that imply unfinished features work; represent future capture, export, AI, spatial, and collaboration features only when there is a real implementation path.
- Design macOS first for testing and iteration, but avoid choices that would make iOS feel bolted on later.
- Treat Apple frameworks as creative material: Core Haptics, AVAudioEnvironmentNode, MetalFX, Sound Analysis, Core ML, Foundation Models, SwiftData, App Intents, and SharePlay can all become product features when they serve the experience.

## Near-Term Creative Bets

- **Spectral terrain:** convert FFT bands into a responsive field or relief surface.
- **Instrument modes:** switch between tunnel, constellation, liquid surface, and spectrogram stage instead of one permanent scene.
- **Gesture performance:** map trackpad or touch input to camera pressure, particle attraction, and filter sweeps.
- **Spatial notes:** turn note nodes into actual positioned audio emitters when synthesis is active.
- **Scene recipes:** save and recall palette/motion/audio mappings as native presets.
- **Prompted presets:** later, use on-device Foundation Models to generate scene recipes from short prompts when available.

## What Not To Do

- Do not recreate every panel or shader from the web app just because it exists.
- Do not let the old Three.js scene dictate the native renderer architecture.
- Do not wait for full feature parity before making the native app feel distinctive.
- Do not add decorative complexity that makes the app slower to understand or worse to perform.
